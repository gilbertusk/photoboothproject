import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  sessionId: Types.ObjectId;
  externalId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  qrUrl: string;
  amount: number;
  paidAt?: Date;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
    externalId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'PAID', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
    },
    qrUrl: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        if (ret._id) ret.id = ret._id.toString();
        if (ret.sessionId && typeof ret.sessionId === 'object') {
          ret.session = ret.sessionId;
        }
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
