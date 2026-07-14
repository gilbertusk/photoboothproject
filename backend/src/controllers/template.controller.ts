import { Request, Response } from 'express';
import { z } from 'zod';
import { Template } from '../models/template.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  layout: z.record(z.string(), z.any()).default({}),
  previewUrl: z.string().min(1, 'Preview URL is required'),
  slots: z.number().int().min(1, 'Slots must be at least 1'),
  isActive: z.boolean().optional().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

export const getTemplates = async (_req: Request, res: Response): Promise<void> => {
  const templates = await Template.find().sort({ createdAt: -1 });
  sendSuccess(res, templates, 'Templates retrieved');
};

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  const parsed = createTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const template = await Template.create(parsed.data);
  sendSuccess(res, template, 'Template created', 201);
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  const parsed = updateTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const template = await Template.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  );

  if (!template) {
    sendError(res, 'Template not found', 404);
    return;
  }

  sendSuccess(res, template, 'Template updated');
};

export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  const template = await Template.findByIdAndDelete(req.params.id);

  if (!template) {
    sendError(res, 'Template not found', 404);
    return;
  }

  sendSuccess(res, null, 'Template deleted');
};

export const toggleTemplate = async (req: Request, res: Response): Promise<void> => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    sendError(res, 'Template not found', 404);
    return;
  }

  template.isActive = !template.isActive;
  await template.save();

  sendSuccess(res, template, `Template ${template.isActive ? 'activated' : 'deactivated'}`);
};
