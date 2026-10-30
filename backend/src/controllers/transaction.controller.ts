import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Transaction } from '../models/transaction.model';
import { Session } from '../models/session.model';
import { createQrisTransaction, checkTransactionStatus } from '../services/payment.service';
import { env } from '../config/env';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { AuthRequest, KioskRequest } from '../types';
import { branchFilter, kioskOwns } from '../utils/branch-scope';

const createTransactionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const createTransaction = async (req: KioskRequest, res: Response): Promise<void> => {
  const parsed = createTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const { sessionId } = parsed.data;

  // Check if session exists and is PENDING
  const session = await Session.findById(sessionId);
  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }

  if (!kioskOwns(session, req)) {
    sendError(res, 'Sesi ini milik kiosk lain', 403);
    return;
  }

  if (session.status !== 'PENDING') {
    sendError(res, 'Session is not in PENDING status', 400);
    return;
  }

  // Check if transaction already exists for this session
  const existingTransaction = await Transaction.findOne({ sessionId });
  if (existingTransaction) {
    sendSuccess(res, existingTransaction, 'Transaction already exists');
    return;
  }

  // Create QRIS transaction via Midtrans
  const orderId = `PB-${sessionId}-${Date.now()}`;
  const { qrUrl, externalId } = await createQrisTransaction(orderId, session.finalPrice);

  const transaction = await Transaction.create({
    sessionId,
    // Copied from the session so revenue stays with the branch where the sale started.
    branchId: session.branchId,
    kioskId: session.kioskId,
    externalId,
    status: 'PENDING',
    qrUrl,
    amount: session.finalPrice,
  });

  sendSuccess(res, transaction, 'Transaction created', 201);
};

export const getTransactionStatus = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const transaction = await Transaction.findOne({ sessionId });
  if (!transaction) {
    sendError(res, 'Transaction not found', 404);
    return;
  }

  // If still pending, check with Midtrans
  if (transaction.status === 'PENDING') {
    const status = await checkTransactionStatus(transaction.externalId);

    if (status !== 'pending') {
      const mappedStatus = status === 'paid' ? 'PAID' : status === 'failed' ? 'FAILED' : 'EXPIRED';
      transaction.status = mappedStatus as 'PAID' | 'FAILED' | 'EXPIRED';

      if (mappedStatus === 'PAID') {
        transaction.paidAt = new Date();
        // Also update session status
        await Session.findByIdAndUpdate(sessionId, { status: 'PAID' });
      }

      await transaction.save();
    }
  }

  sendSuccess(res, transaction, 'Transaction status retrieved');
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const {
    order_id,
    transaction_status,
    fraud_status,
    signature_key,
    status_code,
    gross_amount,
  } = req.body;

  // Verify signature from Midtrans
  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  if (signature_key !== expectedSignature) {
    sendError(res, 'Invalid signature', 403);
    return;
  }

  // Extract sessionId from orderId (format: PB-{sessionId}-{timestamp})
  const parts = order_id.split('-');
  const sessionId = parts.slice(1, -1).join('-');

  const transaction = await Transaction.findOne({ sessionId });
  if (!transaction) {
    sendError(res, 'Transaction not found', 404);
    return;
  }

  // Map Midtrans status
  let newStatus: 'PAID' | 'FAILED' | 'EXPIRED' | 'PENDING' = 'PENDING';
  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    if (fraud_status === 'accept' || !fraud_status) {
      newStatus = 'PAID';
    } else {
      newStatus = 'FAILED';
    }
  } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
    newStatus = 'FAILED';
  } else if (transaction_status === 'expire') {
    newStatus = 'EXPIRED';
  }

  transaction.status = newStatus;
  if (newStatus === 'PAID') {
    transaction.paidAt = new Date();
    await Session.findByIdAndUpdate(sessionId, { status: 'PAID' });
  } else if (newStatus === 'EXPIRED') {
    await Session.findByIdAndUpdate(sessionId, { status: 'EXPIRED' });
  }

  await transaction.save();

  // Midtrans expects 200 response
  sendSuccess(res, null, 'Webhook processed');
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = branchFilter(req);
  if (!scope) {
    sendError(res, 'Invalid branchId', 400);
    return;
  }
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string;

  const query: any = { ...scope };
  if (status) {
    query.status = status;
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate({
        path: 'sessionId',
        populate: [
          { path: 'packageId' },
          { path: 'templateId' },
          { path: 'voucherId' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(query),
  ]);

  // Format response data to align with transaction interface
  const formattedTransactions = transactions.map(tx => {
    const sessionObj = tx.sessionId as any;
    return {
      id: tx._id,
      session: sessionObj ? {
        id: sessionObj._id,
        package: sessionObj.packageId ? {
          id: sessionObj.packageId._id,
          name: sessionObj.packageId.name,
          price: sessionObj.packageId.price,
          photoCount: sessionObj.packageId.photoCount,
          duration: sessionObj.packageId.duration,
          includeGif: sessionObj.packageId.includeGif,
          includeEmail: sessionObj.packageId.includeEmail,
          isActive: sessionObj.packageId.isActive,
          createdAt: sessionObj.packageId.createdAt,
          updatedAt: sessionObj.packageId.updatedAt
        } : null,
        template: sessionObj.templateId ? {
          id: sessionObj.templateId._id,
          name: sessionObj.templateId.name,
          slots: sessionObj.templateId.slots,
          isActive: sessionObj.templateId.isActive
        } : null,
        voucher: sessionObj.voucherId ? {
          id: sessionObj.voucherId._id,
          code: sessionObj.voucherId.code,
          type: sessionObj.voucherId.type,
          value: sessionObj.voucherId.value
        } : null,
        status: sessionObj.status,
        totalPrice: sessionObj.totalPrice,
        finalPrice: sessionObj.finalPrice,
        startedAt: sessionObj.startedAt,
        finishedAt: sessionObj.finishedAt,
        createdAt: sessionObj.createdAt
      } : null,
      externalId: tx.externalId,
      branchId: tx.branchId,
      kioskId: tx.kioskId,
      status: tx.status,
      amount: tx.amount,
      paidAt: tx.paidAt,
      createdAt: tx.createdAt
    };
  });

  sendSuccess(res, {
    transactions: formattedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, 'Transactions retrieved');
};

