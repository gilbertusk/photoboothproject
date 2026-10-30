import { Router } from 'express';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../controllers/admin.controller';

const router = Router();
router.use(authMiddleware, requireOwner);
router.get('/', getAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);
export default router;
