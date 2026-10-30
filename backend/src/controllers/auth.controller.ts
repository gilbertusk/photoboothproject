import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Admin } from '../models/admin.model';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const { email, password } = parsed.data;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const token = jwt.sign(
    { id: admin._id.toString(), email: admin.email },
    // Role/branch are re-read from the database on each request; they are not trusted from the token.
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  sendSuccess(res, {
    token,
    admin: {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role ?? 'OWNER',
      branchId: admin.branchId ? String(admin.branchId) : undefined,
    },
  }, 'Login successful');
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const admin = await Admin.findById(req.user?.id).select('-password');
  if (!admin) {
    sendError(res, 'Admin not found', 404);
    return;
  }

  sendSuccess(res, admin, 'Admin data retrieved');
};
