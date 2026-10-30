import { Request, Response } from 'express';
import { z } from 'zod';
import { Media } from '../models/media.model';
import { Session } from '../models/session.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

const createMediaSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  type: z.enum(['PHOTO', 'STRIP', 'GIF']),
  url: z.string().url('URL must be a valid URL'),
  shareToken: z.string().optional(),
  expiredAt: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export const createMedia = async (req: Request, res: Response): Promise<void> => {
  const parsed = createMediaSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const { sessionId, type, url, expiredAt } = parsed.data;

  // Verify session exists
  const session = await Session.findById(sessionId);
  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }

  const shareToken = uuidv4();

  const media = await Media.create({
    sessionId,
    type,
    url,
    shareToken,
    expiredAt,
  });

  sendSuccess(
    res,
    { id: media.id, shareToken, url, type },
    'Media created',
    201,
  );
};

export const getMediaByToken = async (req: Request, res: Response): Promise<void> => {
  const { shareToken } = req.params;

  const media = await Media.findOne({ shareToken }).populate('sessionId');
  if (!media) {
    sendError(res, 'Media not found', 404);
    return;
  }

  // Check expiration
  if (media.expiredAt && media.expiredAt < new Date()) {
    sendError(res, 'Media has expired', 410);
    return;
  }

  sendSuccess(res, media, 'Media retrieved');
};

export const getSessionMedia = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }

  const media = await Media.find({ sessionId }).sort({ createdAt: -1 });

  // Check if any media is expired and filter or mark them
  const now = new Date();
  const activeMedia = media.filter((m) => !m.expiredAt || m.expiredAt >= now);

  sendSuccess(res, {
    session,
    media: activeMedia,
    total: activeMedia.length,
  }, 'Session media retrieved');
};
