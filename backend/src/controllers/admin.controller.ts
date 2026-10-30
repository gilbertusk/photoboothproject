import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Admin } from '../models/admin.model';
import { Branch } from '../models/branch.model';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { isObjectIdString } from '../utils/branch-scope';

const createAdminSchema = z.object({
  email: z.string().trim().email('Email tidak valid'),
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['OWNER', 'BRANCH_ADMIN']),
  branchId: z.string().optional(),
}).refine(v => v.role === 'OWNER' || isObjectIdString(v.branchId), { message: 'Admin cabang wajib memiliki cabang', path: ['branchId'] });

const updateAdminSchema = z.object({
  name: z.string().trim().min(1).optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  role: z.enum(['OWNER', 'BRANCH_ADMIN']).optional(),
  branchId: z.string().nullable().optional(),
});

export const getAdmins = async (_req: AuthRequest, res: Response): Promise<void> => {
  const admins = await Admin.find().select('-password').populate('branchId', 'name code').sort({ createdAt: 1 });
  sendSuccess(res, admins, 'Admins retrieved');
};

export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const { email, name, password, role, branchId } = parsed.data;
  if (role === 'BRANCH_ADMIN' && !(await Branch.findById(branchId))) {
    sendError(res, 'Cabang tidak ditemukan', 404);
    return;
  }
  if (await Admin.findOne({ email: email.toLowerCase() })) {
    sendError(res, 'Email sudah terdaftar', 409);
    return;
  }
  const admin = await Admin.create({
    email, name, role,
    branchId: role === 'BRANCH_ADMIN' ? branchId : undefined,
    password: await bcrypt.hash(password, 12),
  });
  const { password: _omit, ...safe } = admin.toObject();
  sendSuccess(res, safe, 'Admin dibuat', 201);
};

export const updateAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid admin ID', 400); return; }
  const parsed = updateAdminSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const admin = await Admin.findById(req.params.id);
  if (!admin) { sendError(res, 'Admin tidak ditemukan', 404); return; }

  const nextRole = parsed.data.role ?? admin.role ?? 'OWNER';
  if (String(admin._id) === req.user?.id && nextRole !== 'OWNER') {
    sendError(res, 'Tidak dapat menurunkan peran akun sendiri', 400);
    return;
  }
  if (admin.role !== 'BRANCH_ADMIN' && nextRole === 'BRANCH_ADMIN' &&
      (await Admin.countDocuments({ role: { $ne: 'BRANCH_ADMIN' } })) <= 1) {
    sendError(res, 'Harus ada minimal satu owner', 400);
    return;
  }
  const nextBranch = parsed.data.branchId !== undefined ? parsed.data.branchId : admin.branchId ? String(admin.branchId) : null;
  if (nextRole === 'BRANCH_ADMIN') {
    if (!isObjectIdString(nextBranch) || !(await Branch.findById(nextBranch))) {
      sendError(res, 'Admin cabang wajib memiliki cabang yang valid', 400);
      return;
    }
    admin.branchId = nextBranch as any;
  } else {
    admin.branchId = undefined;
  }
  admin.role = nextRole;
  if (parsed.data.name) admin.name = parsed.data.name;
  if (parsed.data.password) admin.password = await bcrypt.hash(parsed.data.password, 12);
  await admin.save();
  const { password: _omit, ...safe } = admin.toObject();
  sendSuccess(res, safe, 'Admin diperbarui');
};

export const deleteAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid admin ID', 400); return; }
  if (req.params.id === req.user?.id) { sendError(res, 'Tidak dapat menghapus akun sendiri', 400); return; }
  const admin = await Admin.findById(req.params.id);
  if (!admin) { sendError(res, 'Admin tidak ditemukan', 404); return; }
  if (admin.role !== 'BRANCH_ADMIN' && (await Admin.countDocuments({ role: { $ne: 'BRANCH_ADMIN' } })) <= 1) {
    sendError(res, 'Harus ada minimal satu owner', 400);
    return;
  }
  await admin.deleteOne();
  sendSuccess(res, null, 'Admin dihapus');
};
