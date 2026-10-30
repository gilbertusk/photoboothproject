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

test('list returns page two with filtered totals across all pages and literal search', async () => {
  const originals = { find: Customer.find, countDocuments: Customer.countDocuments, aggregate: Customer.aggregate };
  let skipped, match, payload;
  Customer.find = filter => {
    match = filter;
    return { sort() { return this; }, skip(n) { skipped = n; return this; }, limit: async () => [{ name: 'Page two' }] };
  };
  Customer.countDocuments = async () => 21;
  Customer.aggregate = async () => [{ totalBookings: 42, totalSpent: 100000, activeCustomers: 21 }];
  try {
    await getCustomers({ query: { page: '2', limit: '10', search: 'a+b' } }, {
      status() { return this; }, json(value) { payload = value.data; },
    });
    assert.equal(skipped, 10);
    assert.equal(payload.customers.length, 1);
    assert.equal(payload.pagination.totalPages, 3);
    assert.equal(payload.stats.totalCustomers, 21);
    assert.equal(payload.stats.totalSpent, 100000);
    assert.equal(match.$or[0].email.$regex, 'a\\+b');
  } finally { Object.assign(Customer, originals); }
});

test('refresh replaces totals on retries and clears totals when last booking is removed', async () => {
  const { refreshCustomer } = require('../dist/services/customer.service');
  const originalAggregate = Booking.aggregate;
  const originalUpdate = Customer.findOneAndUpdate;
  const originalUpdateOne = Customer.updateOne;
  const writes = [];
  let summary = [{ name: 'Customer', totalBookings: 2, totalSpent: 90000 }];
  Booking.aggregate = async () => summary;
  Customer.findOneAndUpdate = async (filter, update) => writes.push({ filter, update });
  Customer.updateOne = async (filter, update) => writes.push({ filter, update });
  try {
    await refreshCustomer(' USER@example.com ');
    await refreshCustomer('user@example.com');
    assert.deepEqual(writes[0], writes[1]);
    assert.equal(writes[0].filter.email, 'user@example.com');
    assert.equal(writes[0].update.$set.totalSpent, 90000);
    assert.equal(writes[0].update.$set.name, undefined);
    summary = [];
    await refreshCustomer('user@example.com');
    assert.equal(writes[2].update.$set.totalBookings, 0);
    assert.equal(writes[2].update.$set.totalSpent, 0);
  } finally {
    Booking.aggregate = originalAggregate;
    Customer.findOneAndUpdate = originalUpdate;
    Customer.updateOne = originalUpdateOne;
  }
});
