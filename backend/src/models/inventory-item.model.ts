import mongoose, { Schema, Document, Types } from 'mongoose';

/** A consumable stocked at one kiosk (paper, ink ribbon...). Quantity is derived from the movement ledger. */
export interface IInventoryItem extends Document {
  kioskId: Types.ObjectId;
  name: string;
  unit: string;
  perPrint: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    kioskId: { type: Schema.Types.ObjectId, ref: 'Kiosk', required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, default: 'lembar' },
    perPrint: { type: Number, required: true, min: 0, default: 1 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 20 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ kioskId: 1, name: 1 }, { unique: true });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
