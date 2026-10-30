import { Router } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';
import { Notification } from '../models/notification.model';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';

const router = Router();
router.use(authMiddleware, requireOwner);
router.get('/', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1) { sendError(res, 'Invalid page', 400); return; }
  const [notifications, total] = await Promise.all([
    Notification.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20),
    Notification.countDocuments(),
  ]);
  sendSuccess(res, { notifications, page, totalPages: Math.max(1, Math.ceil(total / 20)), enabled: env.NOTIFICATIONS_ENABLED, configured: !!env.RESEND_API_KEY });
});
router.post('/:id/retry', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) { sendError(res, 'Invalid notification ID', 400); return; }
  if (!env.NOTIFICATIONS_ENABLED || !env.RESEND_API_KEY) { sendError(res, 'Notification worker or email provider is not configured', 503); return; }
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, status: 'FAILED' },
    { $set: { status: 'PENDING', lastError: '' } }, { new: true });
  if (!notification) { sendError(res, 'Failed notification not found', 409); return; }
  sendSuccess(res, notification, 'Queued for retry');
});
export default router;
