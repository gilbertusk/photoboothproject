import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedia extends Document {
  sessionId: Types.ObjectId;
  type: 'PHOTO' | 'STRIP' | 'GIF';
  url: string;
  shareToken: string;
  expiredAt?: Date;
  createdAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['PHOTO', 'STRIP', 'GIF'],
    },
    url: {
      type: String,
      required: true,
    },
    shareToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiredAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Media = mongoose.model<IMedia>('Media', mediaSchema);
