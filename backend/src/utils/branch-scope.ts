import { Types } from 'mongoose';
import { AuthRequest, KioskRequest } from '../types';

export type BranchFilter = { branchId?: Types.ObjectId };

export const isObjectIdString = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

/**
 * Branch admins are always pinned to their own branch; owners may filter with ?branchId.
 * Returns null when the requested branch filter is malformed.
 */
export function branchFilter(req: AuthRequest): BranchFilter | null {
  if (req.user?.role === 'BRANCH_ADMIN') {
    return isObjectIdString(req.user.branchId) ? { branchId: new Types.ObjectId(req.user.branchId) } : null;
  }
  const requested = req.query?.branchId;
  if (requested === undefined || requested === '') return {};
  if (!isObjectIdString(requested)) return null;
  return { branchId: new Types.ObjectId(requested) };
}

/** A session created by a kiosk may only be advanced by that kiosk. */
export function kioskOwns(record: { kioskId?: unknown }, req: KioskRequest): boolean {
  return !record.kioskId || String(record.kioskId) === String(req.kiosk?._id);
}
