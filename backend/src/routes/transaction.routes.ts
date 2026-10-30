import { Router } from 'express';
import {
  createTransaction,
  getTransactionStatus,
  handleWebhook,
  getTransactions,
} from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { kioskAuth } from '../middlewares/kiosk.middleware';

const router = Router();

// Protected admin routes
router.get('/', authMiddleware, getTransactions);

// Kiosk and Midtrans routes
router.post('/', kioskAuth, createTransaction);
router.post('/webhook', handleWebhook);
router.get('/:sessionId', getTransactionStatus);

export default router;
