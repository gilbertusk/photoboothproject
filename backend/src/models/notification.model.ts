import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
  key: { type: String, required: true, unique: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  kind: { type: String, enum: ['RECEIVED', 'CONFIRMED', 'REMINDER'], required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  text: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'], default: 'PENDING', required: true },
  attempts: { type: Number, default: 0, required: true },
  lockedAt: Date,
  sentAt: Date,
  providerId: String,
  lastError: String,
}, { timestamps: true });
notificationSchema.index({ status: 1, createdAt: 1 });
export const Notification = mongoose.model('Notification', notificationSchema);
