import { Request, Response } from 'express';
import { z } from 'zod';
import { PricingPackage } from '../models/pricing.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const createPricingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  photoCount: z.number().int().min(1, 'Photo count must be at least 1'),
  duration: z.number().int().min(1, 'Duration must be at least 1 second'),
  printCount: z.number().int().min(1, 'Print count must be at least 1').max(5).optional().default(1),
  includeGif: z.boolean().optional().default(false),
  includeEmail: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

const updatePricingSchema = createPricingSchema.partial();

export const getPricingPackages = async (_req: Request, res: Response): Promise<void> => {
  const packages = await PricingPackage.find().sort({ price: 1 });
  sendSuccess(res, packages, 'Pricing packages retrieved');
};

export const createPricingPackage = async (req: Request, res: Response): Promise<void> => {
  const parsed = createPricingSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const pkg = await PricingPackage.create(parsed.data);
  sendSuccess(res, pkg, 'Pricing package created', 201);
};

export const updatePricingPackage = async (req: Request, res: Response): Promise<void> => {
  const parsed = updatePricingSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const pkg = await PricingPackage.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  );

  if (!pkg) {
    sendError(res, 'Pricing package not found', 404);
    return;
  }

  sendSuccess(res, pkg, 'Pricing package updated');
};

export const deletePricingPackage = async (req: Request, res: Response): Promise<void> => {
  const pkg = await PricingPackage.findByIdAndDelete(req.params.id);

  if (!pkg) {
    sendError(res, 'Pricing package not found', 404);
    return;
  }

  sendSuccess(res, null, 'Pricing package deleted');
};

export const togglePricingPackage = async (req: Request, res: Response): Promise<void> => {
  const pkg = await PricingPackage.findById(req.params.id);

  if (!pkg) {
    sendError(res, 'Pricing package not found', 404);
    return;
  }

  pkg.isActive = !pkg.isActive;
  await pkg.save();

  sendSuccess(res, pkg, `Pricing package ${pkg.isActive ? 'activated' : 'deactivated'}`);
};
