import { Request, Response } from 'express';
import { z } from 'zod';
import { Testimonial } from '../models/testimonial.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const createTestimonialSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  role: z.string().optional(),
  eventType: z.string().optional(),
  rating: z.number().min(1).max(5, 'Rating harus antara 1 dan 5'),
  message: z.string().min(1, 'Pesan wajib diisi'),
  imageUrl: z.string().url('URL gambar tidak valid').optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});

const updateTestimonialSchema = createTestimonialSchema.partial();

export const createTestimonial = async (req: Request, res: Response): Promise<void> => {
  const parsed = createTestimonialSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const testimonial = await Testimonial.create(parsed.data);
  sendSuccess(res, testimonial, 'Testimoni berhasil dibuat', 201);
};

export const getTestimonials = async (_req: Request, res: Response): Promise<void> => {
  const testimonials = await Testimonial.find({ isActive: true })
    .sort({ isFeatured: -1, createdAt: -1 });
  sendSuccess(res, testimonials, 'Testimoni berhasil diambil');
};

export const getTestimonialById = async (req: Request, res: Response): Promise<void> => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    sendError(res, 'Testimoni tidak ditemukan', 404);
    return;
  }
  sendSuccess(res, testimonial, 'Testimoni berhasil diambil');
};

export const updateTestimonial = async (req: Request, res: Response): Promise<void> => {
  const parsed = updateTestimonialSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  );

  if (!testimonial) {
    sendError(res, 'Testimoni tidak ditemukan', 404);
    return;
  }

  sendSuccess(res, testimonial, 'Testimoni berhasil diperbarui');
};

export const deleteTestimonial = async (req: Request, res: Response): Promise<void> => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) {
    sendError(res, 'Testimoni tidak ditemukan', 404);
    return;
  }
  sendSuccess(res, null, 'Testimoni berhasil dihapus');
};

export const toggleTestimonial = async (req: Request, res: Response): Promise<void> => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    sendError(res, 'Testimoni tidak ditemukan', 404);
    return;
  }
  testimonial.isActive = !testimonial.isActive;
  await testimonial.save();
  sendSuccess(res, testimonial, `Testimoni ${testimonial.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
};
