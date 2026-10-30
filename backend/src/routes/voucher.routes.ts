import { Router } from 'express';
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  toggleVoucher,
} from '../controllers/voucher.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware, requireOwner);

router.get('/', getVouchers);
router.post('/', createVoucher);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);
router.patch('/:id/toggle', toggleVoucher);

export default router;
