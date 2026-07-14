import { Request, Response } from 'express';
import { z } from 'zod';
import { Voucher } from '../models/voucher.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const createVoucherSchema = z.object({
  code: z.string().min(1, 'Code is required').transform(v => v.toUpperCase()),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().min(0, 'Value must be non-negative'),
  quota: z.number().int().min(0, 'Quota must be non-negative'),
  expiredAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  isActive: z.boolean().optional().default(true),
});

const updateVoucherSchema = z.object({
  code: z.string().min(1).transform(v => v.toUpperCase()).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().min(0).optional(),
  quota: z.number().int().min(0).optional(),
  expiredAt: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : undefined),
  isActive: z.boolean().optional(),
});

export const getVouchers = async (_req: Request, res: Response): Promise<void> => {
  const vouchers = await Voucher.find().sort({ createdAt: -1 });
  sendSuccess(res, vouchers, 'Vouchers retrieved');
};

export const createVoucher = async (req: Request, res: Response): Promise<void> => {
  const parsed = createVoucherSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const voucher = await Voucher.create(parsed.data);
  sendSuccess(res, voucher, 'Voucher created', 201);
};

export const updateVoucher = async (req: Request, res: Response): Promise<void> => {
  const parsed = updateVoucherSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const voucher = await Voucher.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  );

  if (!voucher) {
    sendError(res, 'Voucher not found', 404);
    return;
  }

  sendSuccess(res, voucher, 'Voucher updated');
};

export const deleteVoucher = async (req: Request, res: Response): Promise<void> => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);

  if (!voucher) {
    sendError(res, 'Voucher not found', 404);
    return;
  }

  sendSuccess(res, null, 'Voucher deleted');
};

export const toggleVoucher = async (req: Request, res: Response): Promise<void> => {
  const voucher = await Voucher.findById(req.params.id);

  if (!voucher) {
    sendError(res, 'Voucher not found', 404);
    return;
  }

  voucher.isActive = !voucher.isActive;
  await voucher.save();

  sendSuccess(res, voucher, `Voucher ${voucher.isActive ? 'activated' : 'deactivated'}`);
};

export const validateVoucher = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code) {
    sendError(res, 'Voucher code is required', 400);
    return;
  }

  const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

  if (!voucher) {
    sendError(res, 'Voucher not found or inactive', 404);
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

  sendSuccess(res, {
    id: voucher._id,
    code: voucher.code,
    type: voucher.type,
    value: voucher.value,
  }, 'Voucher is valid');
};
