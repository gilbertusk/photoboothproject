import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  toggleBookingStatus,
  updateBookingPayment,
  getAvailableSlots,
} from '../controllers/booking.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/', createBooking);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', getBookingById);

// Admin routes
router.get('/', authMiddleware, requireOwner, getBookings);
router.put('/:id', authMiddleware, requireOwner, updateBooking);
router.delete('/:id', authMiddleware, requireOwner, deleteBooking);
router.patch('/:id/status', authMiddleware, requireOwner, toggleBookingStatus);
router.patch('/:id/payment', authMiddleware, requireOwner, updateBookingPayment);

export default router;
