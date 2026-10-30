const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.JWT_SECRET = 'test-only';
process.env.RESEND_API_KEY = 're_test';

test('photo email rejects provider error responses instead of reporting success', async () => {
  const { Resend } = require('resend');
  const original = Resend.prototype.post;
  Resend.prototype.post = async () => ({ data: null, error: { message: 'Sender not verified' } });
  try {
    const { sendPhotoEmail } = require('../dist/services/email.service');
    await assert.rejects(sendPhotoEmail('test@example.com', 'https://example.com/photo.png', 'test'), /Sender not verified/);
  } finally { Resend.prototype.post = original; }
});

test('analytics fills seven Jakarta calendar days across UTC midnight', () => {
  const { fillRevenueDays } = require('../dist/services/analytics.service');
  const result = fillRevenueDays([{ _id: '2026-10-31', revenue: 50000 }], new Date('2026-10-30T18:00:00Z'));
  assert.equal(result.length, 7);
  assert.deepEqual(result[0], { date: '2026-10-25', revenue: 0 });
  assert.deepEqual(result[6], { date: '2026-10-31', revenue: 50000 });
});

test('notification retries use stable keys while changed booking details invalidate old mail', () => {
  const { notificationKey, bookingEventTime } = require('../dist/services/notification.service');
  const booking = { _id: 'booking1', customerEmail: 'test@example.com', customerName: 'Test', eventDate: new Date('2026-10-31'), eventTime: '09:00', eventLocation: 'A' };
  assert.equal(bookingEventTime(booking).toISOString(), '2026-10-31T02:00:00.000Z');
  assert.equal(notificationKey(booking, 'CONFIRMED'), notificationKey({ ...booking }, 'CONFIRMED'));
  assert.notEqual(notificationKey(booking, 'CONFIRMED'), notificationKey({ ...booking, eventLocation: 'B' }, 'CONFIRMED'));
});

test('worker records provider failures and accepted IDs, and cancels stale booking mail', async () => {
  const { Notification } = require('../dist/models/notification.model');
  const { Booking } = require('../dist/models/booking.model');
  const email = require('../dist/services/email.service');
  const { deliverNextNotification, notificationKey } = require('../dist/services/notification.service');
  const originals = [Notification.findOneAndUpdate, Notification.updateOne, Booking.findById, email.sendBookingEmail];
  const booking = { _id: 'booking1', status: 'CONFIRMED', customerEmail: 'test@example.com', customerName: 'Test', eventDate: new Date('2099-10-31'), eventTime: '09:00', eventLocation: 'A' };
  const pending = { _id: 'notification1', bookingId: 'booking1', kind: 'CONFIRMED', key: notificationKey(booking, 'CONFIRMED'), to: booking.customerEmail, subject: 'Hello', text: 'Details' };
  const writes = [];
  let sent = 0;
  Notification.findOneAndUpdate = async () => pending;
  Notification.updateOne = async (_filter, update) => writes.push(update.$set);
  Booking.findById = async () => booking;
  try {
    email.sendBookingEmail = async () => { throw new Error('Provider unavailable'); };
    assert.equal(await deliverNextNotification(), true);
    assert.equal(writes.at(-1).status, 'FAILED');
    assert.equal(writes.at(-1).lastError, 'Provider unavailable');
    email.sendBookingEmail = async () => { sent++; return 'provider-123'; };
    await deliverNextNotification();
    assert.equal(writes.at(-1).status, 'SENT');
    assert.equal(writes.at(-1).providerId, 'provider-123');
    booking.status = 'CANCELLED';
    await deliverNextNotification();
    assert.equal(writes.at(-1).status, 'CANCELLED');
    assert.equal(sent, 1);
    Notification.findOneAndUpdate = async () => null;
    assert.equal(await deliverNextNotification(), false);
  } finally {
    [Notification.findOneAndUpdate, Notification.updateOne, Booking.findById, email.sendBookingEmail] = originals;
  }
});

test('reminder scan only queues future confirmed events within 24 hours in WIB', async () => {
  const { Booking } = require('../dist/models/booking.model');
  const { Notification } = require('../dist/models/notification.model');
  const { queueReminders } = require('../dist/services/notification.service');
  const originals = [Booking.find, Notification.updateOne];
  const base = { _id: 'b', customerEmail: 'test@example.com', customerName: 'Test', eventDate: new Date('2026-10-31'), eventLocation: 'A' };
  const rows = [{ ...base, eventTime: '08:00' }, { ...base, eventTime: '10:00' }, { ...base, eventDate: new Date('2026-11-02'), eventTime: '09:00' }];
  const queued = [];
  Booking.find = () => ({ cursor: () => (async function* () { yield* rows; })() });
  Notification.updateOne = async (_filter, update) => queued.push(update.$setOnInsert);
  try {
    await queueReminders(new Date('2026-10-31T02:00:00Z'));
    assert.equal(queued.length, 1);
    assert.match(queued[0].text, /10:00 WIB/);
    assert.equal(queued[0].kind, 'REMINDER');
  } finally { [Booking.find, Notification.updateOne] = originals; }
});

test('analytics returns full database totals and zero-fills empty days', async () => {
  const { Transaction } = require('../dist/models/transaction.model');
  const { Session } = require('../dist/models/session.model');
  const { getDashboardAnalytics } = require('../dist/services/analytics.service');
  const originals = [Transaction.aggregate, Session.aggregate, Session.find];
  Transaction.aggregate = async () => [{ total: [{ revenue: 150100000 }], today: [], days: [], undated: [{ count: 2 }], packages: [{ name: 'Regular', count: 42 }] }];
  Session.aggregate = async () => [{ totalSessions: 1501, totalCompletedSessions: 1400, sessionsToday: 0 }];
  Session.find = () => ({ sort() { return this; }, limit() { return this; }, populate: async () => [] });
  try {
    const stats = await getDashboardAnalytics(new Date('2026-10-30T18:00:00Z'));
    assert.equal(stats.totalSessions, 1501);
    assert.equal(stats.totalRevenue, 150100000);
    assert.equal(stats.revenueToday, 0);
    assert.equal(stats.undatedPayments, 2);
    assert.equal(stats.revenueByDay.length, 7);
    assert.ok(stats.revenueByDay.every(day => day.revenue === 0));
    assert.deepEqual(stats.popularPackages, [{ name: 'Regular', count: 42 }]);
  } finally { [Transaction.aggregate, Session.aggregate, Session.find] = originals; }
});

test('analytics and notification endpoints reject unauthenticated HTTP requests', async () => {
  const express = require('express');
  const app = express();
  app.use('/api/analytics', require('../dist/routes/analytics.routes').default);
  app.use('/api/notifications', require('../dist/routes/notification.routes').default);
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [path, method] of [['/api/analytics', 'GET'], ['/api/notifications', 'GET'], ['/api/notifications/id/retry', 'POST']]) {
      const response = await fetch(base + path, { method });
      assert.equal(response.status, 401);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
