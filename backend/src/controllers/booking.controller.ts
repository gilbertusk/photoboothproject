import { Request, Response } from 'express';
import { z } from 'zod';
import { Booking } from '../models/booking.model';
import { PricingPackage } from '../models/pricing.model';
import { refreshCustomerAfterBooking } from '../services/customer.service';
import { sendSuccess, sendError, formatZodError } from '../utils/response';

const createBookingSchema = z.object({
  customerName: z.string().min(1, 'Nama lengkap wajib diisi'),
  customerEmail: z.string().trim().email('Email tidak valid').toLowerCase(),
  customerPhone: z.string().min(1, 'Nomor telepon wajib diisi'),
  packageId: z.string().min(1, 'Paket wajib dipilih'),
  eventDate: z.string().datetime('Tanggal acara tidak valid'),
  eventTime: z.string().min(1, 'Waktu acara wajib diisi'),
  eventLocation: z.string().min(1, 'Lokasi acara wajib diisi'),
  eventType: z.string().optional(),
  guestCount: z.number().int().min(1).optional(),
  specialRequests: z.string().optional(),
});

const updateBookingSchema = createBookingSchema.partial();

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const { packageId, ...rest } = parsed.data;

  // Validate package exists and is active
  const pkg = await PricingPackage.findById(packageId);
  if (!pkg || !pkg.isActive) {
    sendError(res, 'Paket tidak ditemukan atau tidak aktif', 404);
    return;
  }

  const booking = await Booking.create({
    ...rest,
    packageId,
    totalAmount: pkg.price,
    paymentStatus: 'UNPAID',
    status: 'PENDING',
  });

  const populatedBooking = await Booking.findById(booking._id).populate('packageId');
  await refreshCustomerAfterBooking(booking.customerEmail);

  sendSuccess(res, populatedBooking, 'Pesanan berhasil dibuat', 201);
};

export const getBookings = async (_req: Request, res: Response): Promise<void> => {
  const bookings = await Booking.find()
    .populate('packageId')
    .sort({ createdAt: -1 });
  sendSuccess(res, bookings, 'Pesanan berhasil diambil');
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  const booking = await Booking.findById(req.params.id).populate('packageId');
  if (!booking) {
    sendError(res, 'Pesanan tidak ditemukan', 404);
    return;
  }
  sendSuccess(res, booking, 'Pesanan berhasil diambil');
};

export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  const parsed = updateBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }

  const previous = await Booking.findById(req.params.id);
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    parsed.data,
    { new: true, runValidators: true }
  ).populate('packageId');

  if (!booking) {
    sendError(res, 'Pesanan tidak ditemukan', 404);
    return;
  }

  if (previous && previous.customerEmail !== booking.customerEmail) {
    await refreshCustomerAfterBooking(previous.customerEmail);
  }
  await refreshCustomerAfterBooking(booking.customerEmail);
  sendSuccess(res, booking, 'Pesanan berhasil diperbarui');
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) {
    sendError(res, 'Pesanan tidak ditemukan', 404);
    return;
  }
  await refreshCustomerAfterBooking(booking.customerEmail);
  sendSuccess(res, null, 'Pesanan berhasil dihapus');
};

export const toggleBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    sendError(res, 'Pesanan tidak ditemukan', 404);
    return;
  }

  const statusMap: Record<string, string> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'COMPLETED',
    COMPLETED: 'PENDING',
    CANCELLED: 'PENDING',
  };

  booking.status = statusMap[booking.status] as any;
  await booking.save();

  sendSuccess(res, booking, `Status pesanan diubah menjadi ${booking.status}`);
};

export const updateBookingPayment = async (req: Request, res: Response): Promise<void> => {
  const { paymentStatus, paymentReference } = req.body;

  if (!paymentStatus || !['UNPAID', 'PAID', 'REFUNDED'].includes(paymentStatus)) {
    sendError(res, 'Status pembayaran tidak valid', 400);
    return;
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    sendError(res, 'Pesanan tidak ditemukan', 404);
    return;
  }

  booking.paymentStatus = paymentStatus as any;
  if (paymentReference) {
    booking.paymentReference = paymentReference;
  }
  if (paymentStatus === 'PAID') {
    booking.status = 'CONFIRMED';
  }

  await booking.save();

  await refreshCustomerAfterBooking(booking.customerEmail);
  sendSuccess(res, booking, 'Status pembayaran diperbarui');
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    sendError(res, 'Tanggal wajib disediakan', 400);
    return;
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const bookings = await Booking.find({
    eventDate: { $gte: targetDate, $lt: nextDate },
    status: { $nin: ['CANCELLED'] },
  }).select('eventTime');

  const bookedTimes = bookings.map((b) => b.eventTime);

  // Generate available time slots (09:00 - 21:00, every hour)
  const allSlots: string[] = [];
  for (let h = 9; h <= 21; h++) {
    allSlots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

  sendSuccess(res, {
    date,
    availableSlots,
    bookedTimes,
  }, 'Slot waktu tersedia berhasil diambil');
};
