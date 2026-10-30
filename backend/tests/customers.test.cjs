const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Booking } = require('../dist/models/booking.model');
const { Customer } = require('../dist/models/customer.model');
const { syncCustomersFromBookings, getCustomers } = require('../dist/controllers/customer.controller');

test('booking retains quoted amount and normalizes email', () => {
  const booking = new Booking({ customerEmail: ' User@Example.COM ', totalAmount: 75000 });
  assert.equal(booking.toObject().totalAmount, 75000);
  assert.equal(booking.customerEmail, 'user@example.com');
});

test('sync merges email variants and tolerates legacy missing amounts', async () => {
  const originalFind = Booking.find;
  const originalUpdate = Customer.findOneAndUpdate;
  const writes = [];
  Booking.find = () => ({ populate() { return this; }, sort: async () => [
    { customerEmail: ' USER@example.com ', customerName: 'New', paymentStatus: 'PAID', createdAt: new Date('2026-02-01') },
    { customerEmail: 'user@example.com', customerName: 'Old', paymentStatus: 'PAID', totalAmount: 75000, createdAt: new Date('2026-01-01') },
  ] });
  Customer.findOneAndUpdate = async (filter, update) => writes.push({ filter, update });
  try {
    await syncCustomersFromBookings({}, { status() { return this; }, json() {} });
    assert.equal(writes.length, 1);
    assert.equal(writes[0].filter.email, 'user@example.com');
    assert.equal(writes[0].update.$set.totalSpent, 75000);
    assert.equal(writes[0].update.$set.totalBookings, 2);
  } finally {
    Booking.find = originalFind;
    Customer.findOneAndUpdate = originalUpdate;
  }
});

test('invalid pagination is rejected before querying database', async () => {
  let status;
  await getCustomers({ query: { page: '-1', limit: '999999' } }, {
    status(value) { status = value; return this; }, json() {},
  });
  assert.equal(status, 400);
});
