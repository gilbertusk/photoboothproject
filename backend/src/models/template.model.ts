import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  layout: Record<string, any>;
  previewUrl: string;
  slots: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    layout: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    previewUrl: {
      type: String,
      required: false,
    },
    slots: {
      type: Number,
      required: true,
      min: 1,
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

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
