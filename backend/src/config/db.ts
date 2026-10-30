import mongoose from 'mongoose';
import { env } from './env';

let connecting: Promise<typeof mongoose> | null = null;

// Cached so serverless invocations reuse one connection; throws instead of exiting the process.
export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose.connect(env.MONGODB_URI).catch((error) => {
      connecting = null;
      throw error;
    });
  }
  const conn = await connecting;
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
};
