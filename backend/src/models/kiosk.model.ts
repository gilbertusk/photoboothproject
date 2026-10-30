import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKioskAssignment {
  branchId: Types.ObjectId;
  assignedAt: Date;
  assignedBy?: Types.ObjectId;
}

export interface IKiosk extends Document {
  name: string;
  branchId: Types.ObjectId;
  tokenHash: string;
  isActive: boolean;
  lastSeenAt?: Date;
  assignments: IKioskAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IKioskAssignment>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { _id: false }
);

const kioskSchema = new Schema<IKiosk>(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    isActive: { type: Boolean, default: true },
    lastSeenAt: Date,
    assignments: { type: [assignmentSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        if (ret._id) ret.id = ret._id.toString();
        delete ret.tokenHash;
        return ret;
      },
    },
  }
);

export const Kiosk = mongoose.model<IKiosk>('Kiosk', kioskSchema);
