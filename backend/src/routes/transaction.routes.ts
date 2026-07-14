import { Router } from 'express';
import {
  createTransaction,
  getTransactionStatus,
  handleWebhook,
  getTransactions,
} from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protected admin routes
router.get('/', authMiddleware, getTransactions);

// Public routes (called from photobooth app or Midtrans)
router.post('/', createTransaction);
router.get('/:sessionId', getTransactionStatus);
router.post('/webhook', handleWebhook);

export default router;

