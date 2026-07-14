import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
