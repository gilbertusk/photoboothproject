import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const Setting = mongoose.model<ISetting>('Setting', settingSchema);
