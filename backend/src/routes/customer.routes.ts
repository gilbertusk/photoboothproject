import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  syncCustomersFromBookings,
} from '../controllers/customer.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Admin routes (all require auth)
router.get('/', authMiddleware, getCustomers);
router.get('/:id', authMiddleware, getCustomerById);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);
router.get('/:id/history', authMiddleware, getCustomerHistory);
router.post('/sync', authMiddleware, syncCustomersFromBookings);

export default router;
