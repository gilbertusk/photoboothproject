import { Router } from 'express';
import {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonial,
} from '../controllers/testimonial.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', getTestimonials);
router.get('/:id', getTestimonialById);

// Admin routes
router.post('/', authMiddleware, createTestimonial);
router.put('/:id', authMiddleware, updateTestimonial);
router.delete('/:id', authMiddleware, deleteTestimonial);
router.patch('/:id/toggle', authMiddleware, toggleTestimonial);

export default router;
