import { Response } from 'express';
import { z } from 'zod';
import { Branch } from '../models/branch.model';
import { Kiosk } from '../models/kiosk.model';
import { Admin } from '../models/admin.model';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { isObjectIdString } from '../utils/branch-scope';

const branchSchema = z.object({
  name: z.string().trim().min(1, 'Nama cabang wajib diisi'),
  code: z.string().trim().min(2, 'Kode cabang minimal 2 karakter').max(12).regex(/^[A-Za-z0-9-]+$/, 'Kode hanya huruf, angka, dan tanda hubung'),
  address: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const getBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  const filter = req.user?.role === 'BRANCH_ADMIN' ? { _id: req.user.branchId } : {};
  const branches = await Branch.find(filter).sort({ name: 1 });
  sendSuccess(res, branches, 'Branches retrieved');
};

export const getPublicBranches = async (_req: unknown, res: Response): Promise<void> => {
  const branches = await Branch.find({ isActive: true }).select('name address -_id').sort({ name: 1 }).lean();
  sendSuccess(res, branches, 'Active branches retrieved');
};

export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  if (await Branch.findOne({ code: parsed.data.code.toUpperCase() })) {
    sendError(res, 'Kode cabang sudah dipakai', 409);
    return;
  }
  sendSuccess(res, await Branch.create(parsed.data), 'Cabang dibuat', 201);
};

export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid branch ID', 400); return; }
  const parsed = branchSchema.partial().safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  if (parsed.data.code) {
    const clash = await Branch.findOne({ code: parsed.data.code.toUpperCase(), _id: { $ne: req.params.id } });
    if (clash) { sendError(res, 'Kode cabang sudah dipakai', 409); return; }
  }
  const branch = await Branch.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!branch) { sendError(res, 'Cabang tidak ditemukan', 404); return; }
  sendSuccess(res, branch, 'Cabang diperbarui');
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid branch ID', 400); return; }
  // Historical sessions reference the branch, so in-use branches are deactivated instead.
  const [kiosks, admins] = await Promise.all([
    Kiosk.countDocuments({ branchId: req.params.id }),
    Admin.countDocuments({ branchId: req.params.id }),
  ]);
  if (kiosks || admins) {
    sendError(res, 'Cabang masih memiliki kiosk atau admin. Pindahkan dulu, atau nonaktifkan cabang.', 409);
    return;
  }
  const branch = await Branch.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!branch) { sendError(res, 'Cabang tidak ditemukan', 404); return; }
  sendSuccess(res, branch, 'Cabang dinonaktifkan');
};
