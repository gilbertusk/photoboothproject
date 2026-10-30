import { Request, Response } from 'express';
import { z } from 'zod';
import { Session } from '../models/session.model';
import { PricingPackage } from '../models/pricing.model';
import { Voucher } from '../models/voucher.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { AuthRequest, KioskRequest } from '../types';
import { branchFilter, kioskOwns } from '../utils/branch-scope';

const createSessionSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  templateId: z.string().optional(),
  voucherCode: z.string().optional(),
});

export const createSession = async (req: KioskRequest, res: Response): Promise<void> => {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const { packageId, templateId, voucherCode } = parsed.data;

  // Validate package
  const pkg = await PricingPackage.findById(packageId);
  if (!pkg || !pkg.isActive) {
    sendError(res, 'Pricing package not found or inactive', 404);
    return;
  }

  let totalPrice = pkg.price;
  let finalPrice = totalPrice;
  let voucherId: string | undefined;

  // Apply voucher if provided
  if (voucherCode) {
    const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase(), isActive: true });

    if (!voucher) {
      sendError(res, 'Voucher not found or inactive', 400);
      return;
    }

    if (voucher.expiredAt && voucher.expiredAt < new Date()) {
      sendError(res, 'Voucher has expired', 400);
      return;
    }

    if (voucher.used >= voucher.quota) {
      sendError(res, 'Voucher quota has been reached', 400);
      return;
    }

    // Calculate discount
    if (voucher.type === 'PERCENTAGE') {
      finalPrice = totalPrice - (totalPrice * voucher.value / 100);
    } else {
      finalPrice = totalPrice - voucher.value;
    }

    finalPrice = Math.max(0, Math.round(finalPrice));
    voucherId = voucher._id.toString();

    // Increment voucher usage
    voucher.used += 1;
    await voucher.save();
  }

  const session = await Session.create({
    packageId,
    templateId: templateId || undefined,
    voucherId: voucherId || undefined,
    branchId: req.kiosk?.branchId,
    kioskId: req.kiosk?._id,
    status: 'PENDING',
    totalPrice,
    finalPrice,
  });

  const populatedSession = await Session.findById(session._id)
    .populate('packageId')
    .populate('templateId');

  sendSuccess(res, populatedSession, 'Session created', 201);
};

export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = branchFilter(req);
  if (!scope) {
    sendError(res, 'Invalid branchId', 400);
    return;
  }
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    Session.find(scope)
      .populate('packageId')
      .populate('templateId')
      .populate('voucherId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Session.countDocuments(scope),
  ]);

  sendSuccess(res, {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, 'Sessions retrieved');
};

export const getSessionById = async (req: Request, res: Response): Promise<void> => {
  const session = await Session.findById(req.params.id)
    .populate('packageId')
    .populate('templateId')
    .populate('voucherId');

  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }

  sendSuccess(res, session, 'Session retrieved');
};

export const startSession = async (req: KioskRequest, res: Response): Promise<void> => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }

  if (!kioskOwns(session, req)) {
    sendError(res, 'Sesi ini milik kiosk lain', 403);
    return;
  }

  if (session.status !== 'PAID') {
    sendError(res, 'Session must be paid before starting', 400);
    return;
  }

  // Update templateId if provided in request body
  if (req.body.templateId) {
    session.templateId = req.body.templateId;
  }

  session.status = 'IN_PROGRESS';
  session.startedAt = new Date();
  await session.save();

  sendSuccess(res, session, 'Session started');
};

export const completeSession = async (req: KioskRequest, res: Response): Promise<void> => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }

  if (!kioskOwns(session, req)) {
    sendError(res, 'Sesi ini milik kiosk lain', 403);
    return;
  }

  if (session.status !== 'IN_PROGRESS') {
    sendError(res, 'Session must be in progress to complete', 400);
    return;
  }

  session.status = 'COMPLETED';
  session.finishedAt = new Date();
  await session.save();

  sendSuccess(res, session, 'Session completed');
};
