import { Request, Response } from 'express';
import { z } from 'zod';
import { Setting } from '../models/setting.model';
import { sendSuccess, sendError } from '../utils/response';

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  const settings = await Setting.find();

  // Convert to key-value object
  const settingsObj: Record<string, string> = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });

  sendSuccess(res, settingsObj, 'Settings retrieved');
};

const updateSettingsSchema = z.record(z.string(), z.string());

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid settings format. Expected { key: value } object.', 400);
    return;
  }

  const entries = Object.entries(parsed.data);

  const bulkOps = entries.map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: { key, value },
      upsert: true,
    },
  }));

  await Setting.bulkWrite(bulkOps);

  // Return updated settings
  const settings = await Setting.find();
  const settingsObj: Record<string, string> = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });

  sendSuccess(res, settingsObj, 'Settings updated');
};
