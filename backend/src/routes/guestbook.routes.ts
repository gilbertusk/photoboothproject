import { Router } from 'express';
import { getGuestbook } from '../controllers/guestbook.controller';

const router = Router();

// Public route — no auth required for guestbook viewers
router.get('/', getGuestbook);

export default router;
