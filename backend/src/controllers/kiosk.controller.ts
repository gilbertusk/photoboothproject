import { Response } from 'express';
import { z } from 'zod';
import { Kiosk } from '../models/kiosk.model';
import { Branch } from '../models/branch.model';
import { AuthRequest, KioskRequest } from '../types';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { branchFilter, isObjectIdString } from '../utils/branch-scope';
import { generateKioskToken, hashKioskToken } from '../middlewares/kiosk.middleware';

const createKioskSchema = z.object({
  name: z.string().trim().min(1, 'Nama kiosk wajib diisi'),
  branchId: z.string().refine(isObjectIdString, 'Cabang tidak valid'),
});

const moveKioskSchema = z.object({
  branchId: z.string().refine(isObjectIdString, 'Cabang tidak valid'),
});

export const getKiosks = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = branchFilter(req);
  if (!scope) { sendError(res, 'Invalid branchId', 400); return; }
  const kiosks = await Kiosk.find(scope).populate('branchId', 'name code').sort({ name: 1 });
  sendSuccess(res, kiosks, 'Kiosks retrieved');
};

export const createKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createKioskSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const branch = await Branch.findById(parsed.data.branchId);
  if (!branch || !branch.isActive) { sendError(res, 'Cabang tidak ditemukan atau nonaktif', 404); return; }

  // The plain token is only ever returned once; only its hash is stored.
  const token = generateKioskToken();
  const kiosk = await Kiosk.create({
    name: parsed.data.name,
    branchId: branch._id,
    tokenHash: hashKioskToken(token),
    assignments: [{ branchId: branch._id, assignedAt: new Date(), assignedBy: req.user?.id }],
  });
  sendSuccess(res, { kiosk, token }, 'Kiosk didaftarkan. Simpan token ini; token tidak dapat ditampilkan lagi.', 201);
};

export const moveKiosk = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid kiosk ID', 400); return; }
  const parsed = moveKioskSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }

  const kiosk = await Kiosk.findById(req.params.id);
  if (!kiosk) { sendError(res, 'Kiosk tidak ditemukan', 404); return; }
  const branch = await Branch.findById(parsed.data.branchId);
  if (!branch || !branch.isActive) { sendError(res, 'Cabang tujuan tidak ditemukan atau nonaktif', 404); return; }

  if (String(kiosk.branchId) !== String(branch._id)) {
    // Past sessions/transactions keep their own branchId snapshot; only future records follow the move.
    kiosk.branchId = branch._id as typeof kiosk.branchId;
    kiosk.assignments.push({ branchId: branch._id as typeof kiosk.branchId, assignedAt: new Date(), assignedBy: req.user?.id as any });
    await kiosk.save();
  }
  sendSuccess(res, kiosk, 'Kiosk dipindahkan');
};

export const setKioskActive = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid kiosk ID', 400); return; }
  if (typeof req.body?.isActive !== 'boolean') { sendError(res, 'isActive must be boolean', 400); return; }
  const scope = branchFilter(req);
  if (!scope) { sendError(res, 'Invalid branchId', 400); return; }
  const kiosk = await Kiosk.findOneAndUpdate({ _id: req.params.id, ...scope }, { isActive: req.body.isActive }, { new: true });
  if (!kiosk) { sendError(res, 'Kiosk tidak ditemukan', 404); return; }
  sendSuccess(res, kiosk, req.body.isActive ? 'Kiosk diaktifkan' : 'Kiosk dinonaktifkan');
};

export const rotateKioskToken = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid kiosk ID', 400); return; }
  const token = generateKioskToken();
  const kiosk = await Kiosk.findByIdAndUpdate(req.params.id, { tokenHash: hashKioskToken(token) }, { new: true });
  if (!kiosk) { sendError(res, 'Kiosk tidak ditemukan', 404); return; }
  sendSuccess(res, { kiosk, token }, 'Token baru dibuat. Token lama tidak berlaku lagi.');
};

/** Called by the kiosk itself to confirm its token and show the current branch. */
export const getCurrentKiosk = async (req: KioskRequest, res: Response): Promise<void> => {
  const kiosk = await Kiosk.findById(req.kiosk?._id).populate('branchId', 'name code');
  if (!kiosk) { sendError(res, 'Kiosk tidak ditemukan', 404); return; }
  sendSuccess(res, kiosk, 'Kiosk identity');
};
