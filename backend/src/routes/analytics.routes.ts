import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getDashboardAnalytics } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

const router = Router();
router.get('/', authMiddleware, async (_req, res) => {
  sendSuccess(res, await getDashboardAnalytics(), 'Dashboard analytics retrieved');
});
export default router;
