import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import templateRoutes from './routes/template.routes';
import pricingRoutes from './routes/pricing.routes';
import voucherRoutes from './routes/voucher.routes';
import sessionRoutes from './routes/session.routes';
import bookingRoutes from './routes/booking.routes';
import testimonialRoutes from './routes/testimonial.routes';
import guestbookRoutes from './routes/guestbook.routes';
import customerRoutes from './routes/customer.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import branchRoutes from './routes/branch.routes';
import kioskRoutes from './routes/kiosk.routes';
import adminRoutes from './routes/admin.routes';
import inventoryRoutes from './routes/inventory.routes';
import { kioskAuth } from './middlewares/kiosk.middleware';
import { startNotificationWorker } from './services/notification.service';
import settingRoutes from './routes/setting.routes';
import uploadRoutes from './routes/upload.routes';
import transactionRoutes from './routes/transaction.routes';
import mediaRoutes from './routes/media.routes';

// Import models for public routes
import { PricingPackage } from './models/pricing.model';
import { Template } from './models/template.model';
import { validateVoucher } from './controllers/voucher.controller';
import { sendSuccess, sendError } from './utils/response';
import { getLocalIp } from './utils/ip';
import { getSettings } from './controllers/setting.controller';
import { sendPhotoEmail } from './services/email.service';
import { Session } from './models/session.model';
import { uploadFile } from './services/storage.service';
import multer from 'multer';
import { randomUUID as uuidv4 } from 'crypto';
import path from 'path';

// Multer for public file uploads
const publicUpload = multer({
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

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...env.CORS_ORIGINS.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, backend to backend, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development mode, allow any local address (localhost, 127.0.0.1, or local IP networks like 192.168.x.x)
    if (env.NODE_ENV === 'development') {
      const isLocalhost = 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') || 
        origin.startsWith('http://127.0.0.1:') || 
        origin.startsWith('https://127.0.0.1:');
      
      const isLocalIP = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
      
      if (isLocalhost || isLocalIP) {
        return callback(null, true);
      }
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static uploads directory during local development
app.use('/public/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// Ensure a DB connection before any API work (serverless instances start cold).
app.use('/api', async (_req, _res, next) => {
  await connectDB();
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/guestbook', guestbookRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/kiosks', kioskRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/inventory', inventoryRoutes);

// Public routes (no auth required, for photobooth app)
app.get('/api/public/packages', async (_req, res) => {
  const packages = await PricingPackage.find({ isActive: true }).sort({ price: 1 });
  sendSuccess(res, packages, 'Active packages retrieved');
});

app.get('/api/public/templates', async (_req, res) => {
  const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
  sendSuccess(res, templates, 'Active templates retrieved');
});

app.post('/api/public/vouchers/validate', validateVoucher);

app.get('/api/public/settings', getSettings);

app.post('/api/public/upload', kioskAuth, publicUpload.single('image'), async (req, res): Promise<void> => {
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

app.post('/api/public/send-email', kioskAuth, async (req, res): Promise<void> => {
  const { sessionId, email, shareUrl } = req.body;
  if (!sessionId || !email) {
    sendError(res, 'sessionId and email are required', 400);
    return;
  }
  const session = await Session.findById(sessionId);
  if (!session) {
    sendError(res, 'Session not found', 404);
    return;
  }
  
  await sendPhotoEmail(email, shareUrl || '', sessionId);
  sendSuccess(res, null, 'Email sent successfully');
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler (must be last)
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  await connectDB();
  if (env.NOTIFICATIONS_ENABLED) startNotificationWorker();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

// On Vercel the exported app runs as a function; only listen when running as a normal server.
if (!process.env.VERCEL) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

export default app;
