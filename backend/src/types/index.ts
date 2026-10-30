import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthPayload {
  id: string;
  email: string;
  role: 'OWNER' | 'BRANCH_ADMIN';
  branchId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface KioskIdentity {
  _id: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  name?: string;
}

export interface KioskRequest extends Request {
  kiosk?: KioskIdentity;
}
