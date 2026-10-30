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
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/', createBooking);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', getBookingById);

// Admin routes
router.get('/', authMiddleware, getBookings);
router.put('/:id', authMiddleware, updateBooking);
router.delete('/:id', authMiddleware, deleteBooking);
router.patch('/:id/status', authMiddleware, toggleBookingStatus);
router.patch('/:id/payment', authMiddleware, updateBookingPayment);

export default router;
