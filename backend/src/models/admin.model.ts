import mongoose, { Schema, Document, Types } from 'mongoose';

export type AdminRole = 'OWNER' | 'BRANCH_ADMIN';

export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
  branchId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Admins created before branches existed are owners.
    role: {
      type: String,
      enum: ['OWNER', 'BRANCH_ADMIN'],
      default: 'OWNER',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: function (this: IAdmin) { return this.role === 'BRANCH_ADMIN'; },
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
