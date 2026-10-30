import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireKiosk } from '../middlewares/kiosk.middleware';
import {
  recordPrint, getInventory, createItem, updateItem, restockItem, adjustItem, getItemMovements,
} from '../controllers/inventory.controller';

const router = Router();
// Kiosk reports each print attempt; stock is deducted from that kiosk's items.
router.post('/prints', requireKiosk, recordPrint);

// Owners see every branch; branch admins are pinned to theirs inside the controller.
router.get('/', authMiddleware, getInventory);
router.post('/items', authMiddleware, createItem);
router.put('/items/:id', authMiddleware, updateItem);
router.post('/items/:id/restock', authMiddleware, restockItem);
router.post('/items/:id/adjust', authMiddleware, adjustItem);
router.get('/items/:id/movements', authMiddleware, getItemMovements);
export default router;
