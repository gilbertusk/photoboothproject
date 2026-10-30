import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware, requireOwner);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
