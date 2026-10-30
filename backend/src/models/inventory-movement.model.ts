import mongoose, { Schema, Document, Types } from 'mongoose';

export type MovementKind = 'PRINT' | 'REPRINT' | 'RESTOCK' | 'ADJUST';

export interface IInventoryMovement extends Document {
  itemId: Types.ObjectId;
  kioskId: Types.ObjectId;
  branchId: Types.ObjectId;
  kind: MovementKind;
  delta: number;
  sessionId?: Types.ObjectId;
  printJobId?: Types.ObjectId;
  adminId?: Types.ObjectId;
  note?: string;
  idempotencyKey: string;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    kioskId: { type: Schema.Types.ObjectId, ref: 'Kiosk', required: true },
    // Branch where the kiosk stood when stock moved; kiosks may move later.
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    kind: { type: String, enum: ['PRINT', 'REPRINT', 'RESTOCK', 'ADJUST'], required: true },
    delta: { type: Number, required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    printJobId: { type: Schema.Types.ObjectId, ref: 'PrintJob' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    note: { type: String, trim: true, maxlength: 200 },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryMovementSchema.index({ itemId: 1, createdAt: -1 });

// Corrections are new ADJUST entries, never edits, so the history stays auditable.
const appendOnly = () => { throw new Error('Inventory ledger is append-only'); };
inventoryMovementSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  appendOnly
);
inventoryMovementSchema.pre('deleteOne', { document: true, query: false }, appendOnly);

export const InventoryMovement = mongoose.model<IInventoryMovement>('InventoryMovement', inventoryMovementSchema);
