import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingPackage extends Document {
  name: string;
  price: number;
  photoCount: number;
  duration: number;
  printCount: number;
  includeGif: boolean;
  includeEmail: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pricingPackageSchema = new Schema<IPricingPackage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    photoCount: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    printCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    includeGif: {
      type: Boolean,
      default: false,
    },
    includeEmail: {
      type: Boolean,
      default: false,
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

export const PricingPackage = mongoose.model<IPricingPackage>('PricingPackage', pricingPackageSchema);
