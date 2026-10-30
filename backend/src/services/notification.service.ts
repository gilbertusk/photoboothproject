import { Booking, IBooking } from '../models/booking.model';
import { Notification } from '../models/notification.model';
import { sendBookingEmail } from './email.service';
import { createHash } from 'crypto';

type Kind = 'RECEIVED' | 'CONFIRMED' | 'REMINDER';
export function notificationKey(booking: IBooking, kind: Kind): string {
  const digest = createHash('sha256').update(JSON.stringify([
    booking.customerEmail, booking.customerName, booking.eventDate.toISOString(), booking.eventTime, booking.eventLocation,
  ])).digest('hex').slice(0, 32);
  return `${booking._id}:${kind}:${digest}`;
}
export function bookingEventTime(booking: Pick<IBooking, 'eventDate' | 'eventTime'>): Date {
  return new Date(`${booking.eventDate.toISOString().slice(0, 10)}T${booking.eventTime}:00+07:00`);
}

export async function queueBookingNotification(booking: IBooking, kind: Kind): Promise<void> {
  const date = booking.eventDate.toISOString().slice(0, 10);
  const key = notificationKey(booking, kind);
  const title = { RECEIVED: 'Booking diterima', CONFIRMED: 'Booking dikonfirmasi', REMINDER: 'Pengingat acara' }[kind];
  const text = `Halo ${booking.customerName},\n\n${title}.\nTanggal: ${date}\nWaktu: ${booking.eventTime} WIB\nLokasi: ${booking.eventLocation}\nReferensi: ${booking._id}\n\nTerima kasih,\nbertpixx`;
  try {
    await Notification.updateOne({ key }, { $setOnInsert: {
      key, bookingId: booking._id, kind, to: booking.customerEmail, subject: `bertpixx — ${title}`, text,
    } }, { upsert: true });
  } catch (error) {
    // Concurrent scans may both attempt the same unique key.
    if ((error as { code?: number }).code !== 11000) throw error;
  }
}

export async function queueBookingNotificationSafely(booking: IBooking, kind: Kind): Promise<void> {
  try { await queueBookingNotification(booking, kind); }
  catch (error) { console.error('Failed to queue booking notification', error); }
}

export async function queueReminders(now = new Date()): Promise<void> {
  const nextDay = new Date(now.getTime() + 86400000);
  // Event dates are stored as date-only UTC midnight; widen bounds before exact WIB check.
  const bookings = Booking.find({ status: 'CONFIRMED', eventDate: {
    $gte: new Date(now.getTime() - 86400000), $lte: new Date(nextDay.getTime() + 86400000),
  } }).cursor();
  for await (const booking of bookings) {
    const event = bookingEventTime(booking);
    if (event > now && event <= nextDay) await queueBookingNotification(booking, 'REMINDER');
  }
}

export async function deliverNextNotification(): Promise<boolean> {
  const notification = await Notification.findOneAndUpdate(
    { status: 'PENDING' },
    { $set: { status: 'SENDING', lockedAt: new Date() }, $inc: { attempts: 1 } },
    { new: true, sort: { createdAt: 1 } },
  );
  if (!notification) return false;
  try {
    const booking = await Booking.findById(notification.bookingId);
    const stale = !booking || booking.status === 'CANCELLED' || booking.status === 'COMPLETED' ||
      notification.to !== booking.customerEmail ||
      notification.key !== notificationKey(booking, notification.kind) ||
      (notification.kind !== 'RECEIVED' && booking.status !== 'CONFIRMED') ||
      (notification.kind === 'REMINDER' && bookingEventTime(booking) <= new Date());
    if (stale) {
      await Notification.updateOne({ _id: notification._id }, { $set: { status: 'CANCELLED', lastError: 'Booking changed or no longer eligible' } });
      return true;
    }
    const providerId = await sendBookingEmail(notification.to, notification.subject, notification.text, notification.key);
    await Notification.updateOne({ _id: notification._id }, { $set: { status: 'SENT', providerId, sentAt: new Date(), lastError: '' } });
  } catch (error) {
    await Notification.updateOne({ _id: notification._id }, { $set: {
      status: 'FAILED', lastError: error instanceof Error ? error.message : 'Email delivery failed',
    } });
  }
  return true;
}

export function startNotificationWorker(): NodeJS.Timeout {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      // Do not blindly resend an ambiguous delivery after a process crash.
      await Notification.updateMany({ status: 'SENDING', lockedAt: { $lt: new Date(Date.now() - 10 * 60000) } },
        { $set: { status: 'FAILED', lastError: 'Delivery interrupted; verify provider status before retrying' } });
      await queueReminders();
      for (let i = 0; i < 20; i++) {
        if (!await deliverNextNotification()) break;
      }
    } catch (error) { console.error('Notification worker failed', error); }
    finally { busy = false; }
  };
  void tick();
  const timer = setInterval(() => { void tick(); }, 60000);
  timer.unref();
  return timer;
}
