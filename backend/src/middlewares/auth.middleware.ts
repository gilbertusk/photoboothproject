import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Admin } from '../models/admin.model';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access denied. No token provided.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded: { id: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
  } catch {
    sendError(res, 'Invalid or expired token.', 401);
    return;
  }

  // Role and branch come from the database so demotions take effect before the token expires.
  let admin: { _id: unknown; email: string; role?: 'OWNER' | 'BRANCH_ADMIN'; branchId?: unknown } | null;
  try {
    admin = await Admin.findById(decoded.id).select('email role branchId').lean();
  } catch (error) {
    if ((error as { name?: string }).name === 'CastError') admin = null;
    else { next(error); return; }
  }
  if (!admin) {
    sendError(res, 'Admin account no longer exists.', 401);
    return;
  }

  const role = admin.role ?? 'OWNER';
  if (role === 'BRANCH_ADMIN' && !admin.branchId) {
    sendError(res, 'Branch admin has no branch assigned.', 403);
    return;
  }

  req.user = {
    id: String(admin._id),
    email: admin.email,
    role,
    branchId: admin.branchId ? String(admin.branchId) : undefined,
  };
  next();
};

export const requireOwner = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'OWNER') {
    sendError(res, 'Hanya owner yang dapat mengakses fitur ini.', 403);
    return;
  }
  next();
};
