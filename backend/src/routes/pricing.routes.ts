import { Router } from 'express';
import {
  getPricingPackages,
  createPricingPackage,
  updatePricingPackage,
  deletePricingPackage,
  togglePricingPackage,
} from '../controllers/pricing.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getPricingPackages);
router.post('/', createPricingPackage);
router.put('/:id', updatePricingPackage);
router.delete('/:id', deletePricingPackage);
router.patch('/:id/toggle', togglePricingPackage);

export default router;
