import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID as uuidv4 } from 'crypto';
import path from 'path';
import { uploadFile } from '../services/storage.service';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { getLocalIp } from '../utils/ip';
import { env } from '../config/env';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

router.post('/image', authMiddleware, requireOwner, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    sendError(res, 'No image file provided', 400);
    return;
  }

  const ext = path.extname(req.file.originalname) || '.jpg';
  const key = `uploads/${uuidv4()}${ext}`;

  const url = await uploadFile(req.file.buffer, key, req.file.mimetype);
  const localIp = getLocalIp();
  const localUrl = `http://${localIp}:${env.PORT}/public/uploads/${path.basename(key)}`;

  sendSuccess(res, { url, key, localUrl }, 'Image uploaded successfully', 201);
});

export default router;
