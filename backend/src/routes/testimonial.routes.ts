import { Router } from 'express';
import {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonial,
} from '../controllers/testimonial.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', getTestimonials);
router.get('/:id', getTestimonialById);

// Admin routes
router.post('/', authMiddleware, requireOwner, createTestimonial);
router.put('/:id', authMiddleware, requireOwner, updateTestimonial);
router.delete('/:id', authMiddleware, requireOwner, deleteTestimonial);
router.patch('/:id/toggle', authMiddleware, requireOwner, toggleTestimonial);

export default router;
