import { Router } from 'express';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branch.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', getBranches);
router.post('/', requireOwner, createBranch);
router.put('/:id', requireOwner, updateBranch);
router.delete('/:id', requireOwner, deleteBranch);
export default router;
