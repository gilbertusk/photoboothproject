import { Request, Response } from 'express';
import { z } from 'zod';
import { Customer } from '../models/customer.model';
import { Booking } from '../models/booking.model';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const updateCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').optional(),
  phone: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emailMatch = (email: string) => ({ customerEmail: { $regex: `^\\s*${escapeRegex(email)}\\s*$`, $options: 'i' } });

export const getCustomers = async (_req: Request, res: Response): Promise<void> => {
  const parsed = paginationSchema.safeParse(_req.query);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const search = typeof _req.query.search === 'string' ? escapeRegex(_req.query.search.trim()) : '';

  const match: Record<string, any> = {};
  if (search) {
    match.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [customers, total, totals] = await Promise.all([
    Customer.find(match).sort({ lastBookingAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(match),
    Customer.aggregate([{ $match: match }, { $group: {
      _id: null, totalBookings: { $sum: '$totalBookings' }, totalSpent: { $sum: '$totalSpent' },
      activeCustomers: { $sum: { $cond: [{ $gt: ['$totalBookings', 0] }, 1, 0] } },
    } }]),
  ]);

  sendSuccess(res, {
    customers,
    stats: { totalCustomers: total, totalBookings: 0, totalSpent: 0, activeCustomers: 0, ...totals[0] },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }, 'Pelanggan berhasil diambil');
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    sendError(res, 'Pelanggan tidak ditemukan', 404);
    return;
  }

  // Get customer's bookings
  const bookings = await Booking.find(emailMatch(customer.email))
    .populate('packageId')
    .sort({ createdAt: -1 });

  sendSuccess(res, { customer, bookings }, 'Detail pelanggan berhasil diambil');
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  );

  if (!customer) {
    sendError(res, 'Pelanggan tidak ditemukan', 404);
    return;
  }

  sendSuccess(res, customer, 'Pelanggan berhasil diperbarui');
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    sendError(res, 'Pelanggan tidak ditemukan', 404);
    return;
  }
  sendSuccess(res, null, 'Pelanggan berhasil dihapus');
};

export const getCustomerHistory = async (req: Request, res: Response): Promise<void> => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    sendError(res, 'Pelanggan tidak ditemukan', 404);
    return;
  }

  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) { sendError(res, formatZodError(parsed.error), 400); return; }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(emailMatch(customer.email))
      .populate('packageId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(emailMatch(customer.email)),
  ]);

  sendSuccess(res, {
    customer,
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }, 'Riwayat pelanggan berhasil diambil');
};

export const syncCustomersFromBookings = async (_req: Request, res: Response): Promise<void> => {
  // Aggregate all bookings by customer email to create/update customer records
  const bookings = await Booking.find().populate('packageId').sort({ createdAt: -1 });

  const customerMap = new Map<string, {
    name: string;
    email: string;
    phone?: string;
    totalBookings: number;
    totalSpent: number;
    lastBookingAt: Date;
  }>();

  for (const booking of bookings) {
    const key = booking.customerEmail.trim().toLowerCase();
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: booking.customerName,
        email: key,
        phone: booking.customerPhone,
        totalBookings: 0,
        totalSpent: 0,
        lastBookingAt: booking.createdAt,
      });
    }
    const cust = customerMap.get(key)!;
    cust.totalBookings += 1;
    if (booking.paymentStatus === 'PAID') {
      cust.totalSpent += Number.isFinite(booking.totalAmount) ? booking.totalAmount : 0;
    }
    if (new Date(booking.createdAt) > cust.lastBookingAt) {
      cust.lastBookingAt = booking.createdAt;
    }
  }

  // Upsert all customers
  for (const [, cust] of customerMap) {
    await Customer.findOneAndUpdate(
      { email: cust.email },
      {
        $set: {
          totalBookings: cust.totalBookings,
          totalSpent: cust.totalSpent,
          lastBookingAt: cust.lastBookingAt,
        },
        $setOnInsert: { name: cust.name, phone: cust.phone },
      },
      { upsert: true, new: true }
    );
  }

  const syncedCount = customerMap.size;
  sendSuccess(res, { syncedCount }, `${syncedCount} pelanggan telah disinkronkan dari data booking`);
};
