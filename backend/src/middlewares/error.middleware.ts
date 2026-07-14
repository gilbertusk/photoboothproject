import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const messages = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};
