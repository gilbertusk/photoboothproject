import { Router } from 'express';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';
import { requireKiosk } from '../middlewares/kiosk.middleware';
import {
  getKiosks, createKiosk, moveKiosk, setKioskActive, rotateKioskToken, getCurrentKiosk,
} from '../controllers/kiosk.controller';

const router = Router();
// Kiosk-authenticated self lookup must precede the admin routes.
router.get('/me', requireKiosk, getCurrentKiosk);
router.get('/', authMiddleware, getKiosks);
router.post('/', authMiddleware, requireOwner, createKiosk);
router.patch('/:id/branch', authMiddleware, requireOwner, moveKiosk);
router.patch('/:id/active', authMiddleware, setKioskActive);
router.post('/:id/token', authMiddleware, requireOwner, rotateKioskToken);
export default router;
