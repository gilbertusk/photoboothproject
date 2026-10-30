import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getDashboardAnalytics } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';
import { branchFilter } from '../utils/branch-scope';
import { AuthRequest } from '../types';

const router = Router();
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const scope = branchFilter(req);
  if (!scope) { sendError(res, 'Invalid branchId', 400); return; }
  sendSuccess(res, await getDashboardAnalytics(new Date(), scope), 'Dashboard analytics retrieved');
});
export default router;
