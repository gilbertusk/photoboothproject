import { Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Session } from '../models/session.model';
import { Kiosk } from '../models/kiosk.model';
import { InventoryItem } from '../models/inventory-item.model';
import { InventoryMovement } from '../models/inventory-movement.model';
import { PrintJob } from '../models/print-job.model';
import { AuthRequest, KioskRequest } from '../types';
import { sendSuccess, sendError, formatZodError } from '../utils/response';
import { branchFilter, isObjectIdString, kioskOwns } from '../utils/branch-scope';

const objectId = z.string().refine(isObjectIdString, 'ID tidak valid');
// Client-generated (crypto.randomUUID) so a retried request maps to the same record.
const requestKey = z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/, 'ID permintaan tidak valid');

const printSchema = z.object({ sessionId: objectId, attemptId: requestKey });
const restockSchema = z.object({
  quantity: z.number().int().min(1, 'Jumlah minimal 1').max(100000),
  note: z.string().trim().max(200).optional(),
  requestId: requestKey,
});
const adjustSchema = z.object({
  countedQuantity: z.number().int().min(0, 'Jumlah tidak boleh negatif').max(100000),
  note: z.string().trim().max(200).optional(),
  requestId: requestKey,
});
const itemFields = {
  name: z.string().trim().min(1, 'Nama barang wajib diisi').max(60),
  unit: z.string().trim().min(1).max(20),
  perPrint: z.number().min(0).max(100),
  lowStockThreshold: z.number().int().min(0).max(100000),
};
const createItemSchema = z.object({
  kioskId: objectId,
  ...itemFields,
  unit: itemFields.unit.default('lembar'),
  perPrint: itemFields.perPrint.default(1),
  lowStockThreshold: itemFields.lowStockThreshold.default(20),
  initialQuantity: z.number().int().min(0).max(100000).default(0),
});
const updateItemSchema = z.object({ ...itemFields, isActive: z.boolean() }).partial();

const PRINTABLE_STATUSES = ['PAID', 'IN_PROGRESS', 'COMPLETED'];

const isDuplicateKey = (error: unknown): boolean => {
  const err = error as { code?: number; writeErrors?: { code?: number }[] };
  return err?.code === 11000 && (!err.writeErrors || err.writeErrors.every((w) => w.code === 11000));
};

/** Current quantity per item, summed from the ledger. */
async function balances(itemIds: Types.ObjectId[]): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();
  const rows: { _id: Types.ObjectId; quantity: number }[] = await InventoryMovement.aggregate([
    { $match: { itemId: { $in: itemIds } } },
    { $group: { _id: '$itemId', quantity: { $sum: '$delta' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.quantity]));
}

/** Finds the item only if its kiosk is visible to this admin. */
async function scopedItem(req: AuthRequest, res: Response) {
  if (!isObjectIdString(req.params.id)) { sendError(res, 'Invalid item ID', 400); return null; }
  const scope = branchFilter(req);
  if (!scope) { sendError(res, 'Invalid branchId', 400); return null; }
  const item = await InventoryItem.findById(req.params.id);
  const kiosk = item && (await Kiosk.findOne({ _id: item.kioskId, ...scope }));
  if (!item || !kiosk) { sendError(res, 'Barang tidak ditemukan', 404); return null; }
  return { item, kiosk };
}

export const recordPrint = async (req: KioskRequest, res: Response): Promise<void> => {
  const parsed = printSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const kiosk = req.kiosk;
  if (!kiosk) { sendError(res, 'Kiosk belum terdaftar', 401); return; }
  const { sessionId, attemptId } = parsed.data;

  const session = await Session.findById(sessionId);
  if (!session) { sendError(res, 'Session not found', 404); return; }
  if (!kioskOwns(session, req)) { sendError(res, 'Sesi ini milik kiosk lain', 403); return; }
  if (!PRINTABLE_STATUSES.includes(session.status)) { sendError(res, 'Sesi belum dibayar', 409); return; }

  let job = await PrintJob.findOne({ kioskId: kiosk._id, attemptId }).lean();
  let duplicate = Boolean(job);
  if (!job) {
    const kind = (await PrintJob.exists({ sessionId })) ? 'REPRINT' : 'PRINT';
    try {
      // Stock is physically at the kiosk, so the kiosk's current branch is recorded.
      job = await PrintJob.create({ sessionId, kioskId: kiosk._id, branchId: kiosk.branchId, attemptId, kind, copies: 1 });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      job = await PrintJob.findOne({ kioskId: kiosk._id, attemptId }).lean();
      duplicate = true;
    }
  }
  if (!job) { sendError(res, 'Print job could not be recorded', 500); return; }

  const items = (await InventoryItem.find({ kioskId: kiosk._id, isActive: true })).filter((i) => i.perPrint > 0);
  // Keys are deterministic per job and item, so retries also repair a half-written deduction.
  try {
    await InventoryMovement.insertMany(
      items.map((item) => ({
        itemId: item._id,
        kioskId: kiosk._id,
        branchId: job!.branchId,
        kind: job!.kind,
        delta: -item.perPrint * job!.copies,
        sessionId: job!.sessionId,
        printJobId: job!._id,
        idempotencyKey: `print:${job!._id}:${item._id}`,
      })),
      { ordered: false }
    );
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }

  const quantities = await balances(items.map((i) => i._id as Types.ObjectId));
  const lowStock = items
    .map((item) => ({ id: String(item._id), name: item.name, quantity: quantities.get(String(item._id)) ?? 0, lowStockThreshold: item.lowStockThreshold }))
    .filter((i) => i.quantity <= i.lowStockThreshold);

  sendSuccess(res, { printJobId: job._id, kind: job.kind, duplicate, lowStock }, duplicate ? 'Print already recorded' : 'Print recorded', duplicate ? 200 : 201);
};

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = branchFilter(req);
  if (!scope) { sendError(res, 'Invalid branchId', 400); return; }
  const kiosks = await Kiosk.find(scope).populate('branchId', 'name code').sort({ name: 1 }).lean();
  const items = await InventoryItem.find({ kioskId: { $in: kiosks.map((k) => k._id) } }).sort({ name: 1 }).lean();
  const quantities = await balances(items.map((i) => i._id as Types.ObjectId));

  sendSuccess(res, kiosks.map((kiosk) => ({
    id: String(kiosk._id),
    name: kiosk.name,
    isActive: kiosk.isActive,
    branch: kiosk.branchId,
    items: items
      .filter((item) => String(item.kioskId) === String(kiosk._id))
      .map((item) => {
        const quantity = quantities.get(String(item._id)) ?? 0;
        return {
          id: String(item._id),
          name: item.name,
          unit: item.unit,
          perPrint: item.perPrint,
          lowStockThreshold: item.lowStockThreshold,
          isActive: item.isActive,
          quantity,
          lowStock: item.isActive && quantity <= item.lowStockThreshold,
        };
      }),
  })), 'Inventory retrieved');
};

export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createItemSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const scope = branchFilter(req);
  if (!scope) { sendError(res, 'Invalid branchId', 400); return; }
  const { kioskId, initialQuantity, ...fields } = parsed.data;
  const kiosk = await Kiosk.findOne({ _id: kioskId, ...scope });
  if (!kiosk) { sendError(res, 'Kiosk tidak ditemukan', 404); return; }

  let item;
  try {
    item = await InventoryItem.create({ kioskId: kiosk._id, ...fields });
  } catch (error) {
    if (isDuplicateKey(error)) { sendError(res, 'Barang dengan nama ini sudah ada di kiosk tersebut', 409); return; }
    throw error;
  }
  if (initialQuantity > 0) {
    await InventoryMovement.create({
      itemId: item._id, kioskId: kiosk._id, branchId: kiosk.branchId, kind: 'RESTOCK', delta: initialQuantity,
      adminId: req.user?.id, note: 'Stok awal', idempotencyKey: `initial:${item._id}`,
    });
  }
  sendSuccess(res, item, 'Barang ditambahkan', 201);
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const found = await scopedItem(req, res);
  if (!found) return;
  Object.assign(found.item, parsed.data);
  try {
    await found.item.save();
  } catch (error) {
    if (isDuplicateKey(error)) { sendError(res, 'Barang dengan nama ini sudah ada di kiosk tersebut', 409); return; }
    throw error;
  }
  sendSuccess(res, found.item, 'Barang diperbarui');
};

async function appendAdminMovement(
  req: AuthRequest, res: Response, kind: 'RESTOCK' | 'ADJUST',
  found: NonNullable<Awaited<ReturnType<typeof scopedItem>>>, delta: number, requestId: string, note?: string,
): Promise<void> {
  const { item, kiosk } = found;
  try {
    await InventoryMovement.create({
      itemId: item._id, kioskId: kiosk._id, branchId: kiosk.branchId, kind, delta,
      adminId: req.user?.id, note, idempotencyKey: `admin:${req.user?.id}:${requestId}`,
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const quantity = (await balances([item._id as Types.ObjectId])).get(String(item._id)) ?? 0;
    sendSuccess(res, { duplicate: true, quantity }, 'Sudah tercatat');
    return;
  }
  const quantity = (await balances([item._id as Types.ObjectId])).get(String(item._id)) ?? 0;
  sendSuccess(res, { duplicate: false, delta, quantity }, kind === 'RESTOCK' ? 'Stok ditambahkan' : 'Stok disesuaikan', 201);
}

export const restockItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = restockSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const found = await scopedItem(req, res);
  if (!found) return;
  await appendAdminMovement(req, res, 'RESTOCK', found, parsed.data.quantity, parsed.data.requestId, parsed.data.note);
};

/** Stock count: records the difference between the counted and the ledger quantity. */
export const adjustItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const found = await scopedItem(req, res);
  if (!found) return;
  const current = (await balances([found.item._id as Types.ObjectId])).get(String(found.item._id)) ?? 0;
  await appendAdminMovement(req, res, 'ADJUST', found, parsed.data.countedQuantity - current, parsed.data.requestId, parsed.data.note ?? 'Stock opname');
};

export const getItemMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  const found = await scopedItem(req, res);
  if (!found) return;
  const movements = await InventoryMovement.find({ itemId: found.item._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('adminId', 'name')
    .lean();
  sendSuccess(res, movements, 'Movements retrieved');
};
