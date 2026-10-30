import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  syncCustomersFromBookings,
} from '../controllers/customer.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

// Admin routes (all require auth)
router.get('/', authMiddleware, requireOwner, getCustomers);
router.get('/:id', authMiddleware, requireOwner, getCustomerById);
router.put('/:id', authMiddleware, requireOwner, updateCustomer);
router.delete('/:id', authMiddleware, requireOwner, deleteCustomer);
router.get('/:id/history', authMiddleware, requireOwner, getCustomerHistory);
router.post('/sync', authMiddleware, requireOwner, syncCustomersFromBookings);

export default router;
