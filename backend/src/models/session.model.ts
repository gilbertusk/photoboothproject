import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  packageId: Types.ObjectId;
  templateId?: Types.ObjectId;
  voucherId?: Types.ObjectId;
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  totalPrice: number;
  finalPrice: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'PricingPackage',
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
    },
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: 'Voucher',
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
      default: 'PENDING',
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        if (ret._id) ret.id = ret._id.toString();
        if (ret.packageId && typeof ret.packageId === 'object') {
          ret.package = ret.packageId;
        }
        if (ret.templateId && typeof ret.templateId === 'object') {
          ret.template = ret.templateId;
        }
        if (ret.voucherId && typeof ret.voucherId === 'object') {
          ret.voucher = ret.voucherId;
        }
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

export const Session = mongoose.model<ISession>('Session', sessionSchema);
