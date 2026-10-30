import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { env } from '../config/env';
import { Kiosk } from '../models/kiosk.model';
import { KioskRequest } from '../types';

export const generateKioskToken = (): string => `bpk_${crypto.randomBytes(32).toString('base64url')}`;

export const hashKioskToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

// `code` lets the kiosk app distinguish identity failures from other 401/403 responses.
const kioskError = (res: Response, message: string, statusCode: number, code: string): void => {
  res.status(statusCode).json({ success: false, message, code });
};

function kioskGuard(required: () => boolean) {
  return async (req: KioskRequest, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers['x-kiosk-token'];
    const token = Array.isArray(header) ? header[0] : header;

    if (!token) {
      if (!required()) { next(); return; }
      kioskError(res, 'Kiosk belum terdaftar. Hubungkan kiosk melalui halaman /setup.', 401, 'KIOSK_UNREGISTERED');
      return;
    }

    try {
      const kiosk = await Kiosk.findOne({ tokenHash: hashKioskToken(token) });
      if (!kiosk) {
        kioskError(res, 'Token kiosk tidak valid.', 401, 'KIOSK_TOKEN_INVALID');
        return;
      }
      if (!kiosk.isActive) {
        kioskError(res, 'Kiosk dinonaktifkan oleh admin.', 403, 'KIOSK_DISABLED');
        return;
      }
      req.kiosk = kiosk;
      void Kiosk.updateOne({ _id: kiosk._id }, { $set: { lastSeenAt: new Date() } }).catch(() => undefined);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Identifies the kiosk when a token is sent; rejects anonymous calls only if KIOSK_AUTH_REQUIRED=true. */
export const kioskAuth = kioskGuard(() => env.KIOSK_AUTH_REQUIRED);

/** Always requires a valid kiosk token. */
export const requireKiosk = kioskGuard(() => true);
