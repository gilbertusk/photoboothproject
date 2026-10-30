import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        if (ret._id) ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
