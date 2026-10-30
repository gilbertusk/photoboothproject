import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  startSession,
  completeSession,
} from '../controllers/session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { kioskAuth } from '../middlewares/kiosk.middleware';

const router = Router();

// Protected route must come first to avoid /:id matching "list"
router.get('/', authMiddleware, getSessions);

// Kiosk routes (photobooth app)
router.post('/', kioskAuth, createSession);
router.get('/:id', getSessionById);
router.patch('/:id/start', kioskAuth, startSession);
router.patch('/:id/complete', kioskAuth, completeSession);

export default router;
