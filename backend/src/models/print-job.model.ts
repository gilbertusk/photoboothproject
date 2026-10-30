import mongoose, { Schema, Document, Types } from 'mongoose';

/** One print attempt reported by a kiosk; `attemptId` is generated client-side so retries are idempotent. */
export interface IPrintJob extends Document {
  sessionId: Types.ObjectId;
  kioskId: Types.ObjectId;
  branchId: Types.ObjectId;
  attemptId: string;
  kind: 'PRINT' | 'REPRINT';
  copies: number;
  createdAt: Date;
}

const printJobSchema = new Schema<IPrintJob>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    kioskId: { type: Schema.Types.ObjectId, ref: 'Kiosk', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    attemptId: { type: String, required: true },
    kind: { type: String, enum: ['PRINT', 'REPRINT'], required: true },
    copies: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

printJobSchema.index({ kioskId: 1, attemptId: 1 }, { unique: true });

export const PrintJob = mongoose.model<IPrintJob>('PrintJob', printJobSchema);
