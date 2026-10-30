import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: Types.ObjectId;
  eventDate: Date;
  eventTime: string;
  eventLocation: string;
  eventType?: string;
  guestCount?: number;
  specialRequests?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'PricingPackage',
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventTime: {
      type: String,
      required: true,
      trim: true,
    },
    eventLocation: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      trim: true,
    },
    guestCount: {
      type: Number,
      min: 1,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'REFUNDED'],
      default: 'UNPAID',
    },
    paymentReference: {
      type: String,
      trim: true,
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
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Index for querying bookings by date
bookingSchema.index({ eventDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ customerEmail: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
