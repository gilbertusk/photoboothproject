import { Router } from 'express';
import {
  createMedia,
  getMediaByToken,
  getSessionMedia,
} from '../controllers/media.controller';
import { kioskAuth } from '../middlewares/kiosk.middleware';

const router = Router();

// Public routes (no auth required — for photobooth kiosk and gallery viewers)
router.get('/gallery/:shareToken', getMediaByToken);
router.get('/sessions/:sessionId/media', getSessionMedia);

// Public route — kiosk calls this after composing/uploading strip (no admin token required on public kiosk)
router.post('/', kioskAuth, createMedia);

export default router;
