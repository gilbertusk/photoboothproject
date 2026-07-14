import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  startSession,
  completeSession,
} from '../controllers/session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protected route must come first to avoid /:id matching "list"
router.get('/', authMiddleware, getSessions);

// Public routes (photobooth app)
router.post('/', createSession);
router.get('/:id', getSessionById);
router.patch('/:id/start', startSession);
router.patch('/:id/complete', completeSession);

export default router;
