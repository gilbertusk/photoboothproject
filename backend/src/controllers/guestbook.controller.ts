import { Request, Response } from 'express';
import { Media } from '../models/media.model';
import { Session } from '../models/session.model';
import { sendSuccess, sendError } from '../utils/response';

export const getGuestbook = async (_req: Request, res: Response): Promise<void> => {
  const limit = parseInt(_req.query.limit as string) || 20;
  const page = parseInt(_req.query.page as string) || 1;
  const skip = (page - 1) * limit;

  // Find strip media from completed sessions only
  const completedSessions = await Session.find({ status: 'COMPLETED' }).select('_id');
  const completedSessionIds = completedSessions.map((s) => s._id);

  const [media, total] = await Promise.all([
    Media.find({
      sessionId: { $in: completedSessionIds },
      type: 'STRIP',
    })
      .populate('sessionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Media.countDocuments({
      sessionId: { $in: completedSessionIds },
      type: 'STRIP',
    }),
  ]);

  sendSuccess(
    res,
    {
      media,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
    'Guestbook retrieved',
  );
};
