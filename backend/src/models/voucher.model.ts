import mongoose, { Schema, Document } from 'mongoose';

export interface IVoucher extends Document {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  quota: number;
  used: number;
  expiredAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['PERCENTAGE', 'FIXED'],
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    quota: {
      type: Number,
      required: true,
      min: 0,
    },
    used: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiredAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        if (ret._id) ret.id = ret._id.toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

export const Voucher = mongoose.model<IVoucher>('Voucher', voucherSchema);
