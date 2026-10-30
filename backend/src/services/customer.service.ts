import { Booking } from '../models/booking.model';
import { Customer } from '../models/customer.model';

// Recompute from bookings so retries and payment changes cannot double-count.
export async function refreshCustomer(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const [summary] = await Booking.aggregate([
    { $match: { $expr: { $eq: [{ $toLower: { $trim: { input: '$customerEmail' } } }, normalized] } } },
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: null,
      name: { $first: '$customerName' }, phone: { $first: '$customerPhone' },
      totalBookings: { $sum: 1 }, lastBookingAt: { $max: '$createdAt' },
      totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, { $ifNull: ['$totalAmount', 0] }, 0] } },
    } },
  ]);
  if (!summary) {
    await Customer.updateOne({ email: normalized }, {
      $set: { totalBookings: 0, totalSpent: 0 }, $unset: { lastBookingAt: 1 },
    });
    return;
  }
  await Customer.findOneAndUpdate({ email: normalized }, {
    $set: { totalBookings: summary.totalBookings, totalSpent: summary.totalSpent, lastBookingAt: summary.lastBookingAt },
    $setOnInsert: { name: summary.name, phone: summary.phone },
  }, { upsert: true, runValidators: true });
}

// Booking persistence is authoritative. A failed projection can be repaired by admin sync.
export async function refreshCustomerAfterBooking(email: string): Promise<void> {
  try { await refreshCustomer(email); }
  catch (error) { console.error('Customer projection refresh failed; run customer sync', error); }
}
