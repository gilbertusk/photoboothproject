const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.JWT_SECRET = 'test-only';
process.env.KIOSK_AUTH_REQUIRED = 'true';

const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');
const branchA = new Types.ObjectId().toString();
const branchB = new Types.ObjectId().toString();
const kioskId = new Types.ObjectId().toString();

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
function chain(result) {
  const c = { populate() { return c; }, sort() { return c; }, skip() { return c; }, limit() { return c; }, select() { return c; }, lean: async () => result, then: (r, j) => Promise.resolve(result).then(r, j) };
  return c;
}

test('auth loads current role and branch from database, not from stale token claims', async () => {
  const { Admin } = require('../dist/models/admin.model');
  const { authMiddleware } = require('../dist/middlewares/auth.middleware');
  const original = Admin.findById;
  try {
    Admin.findById = () => chain({ _id: 'a1', email: 'x@example.com', role: 'BRANCH_ADMIN', branchId: branchA });
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 'a1', email: 'x@example.com', role: 'OWNER' }, 'test-only')}` } };
    let called = false;
    await authMiddleware(req, response(), () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.user.role, 'BRANCH_ADMIN');
    assert.equal(String(req.user.branchId), branchA);

    Admin.findById = () => chain(null);
    const res = response();
    await authMiddleware({ headers: req.headers }, res, () => assert.fail('deleted admin must not pass'));
    assert.equal(res.statusCode, 401);
  } finally { Admin.findById = original; }
});

test('legacy admins without role are owners; branch admins are rejected from owner routes', () => {
  const { Admin } = require('../dist/models/admin.model');
  const { requireOwner } = require('../dist/middlewares/auth.middleware');
  assert.equal(new Admin({ email: 'a@example.com', password: 'x', name: 'A' }).role, 'OWNER');
  assert.throws(() => { const err = new Admin({ email: 'b@example.com', password: 'x', name: 'B', role: 'BRANCH_ADMIN' }).validateSync(); if (err) throw err; }, /branchId/);
  const res = response();
  requireOwner({ user: { role: 'BRANCH_ADMIN', branchId: branchA } }, res, () => assert.fail('must not pass'));
  assert.equal(res.statusCode, 403);
  let passed = false;
  requireOwner({ user: { role: 'OWNER' } }, response(), () => { passed = true; });
  assert.equal(passed, true);
});

test('branch admins only list their own branch sessions regardless of query', async () => {
  const { Session } = require('../dist/models/session.model');
  const { getSessions } = require('../dist/controllers/session.controller');
  const originals = [Session.find, Session.countDocuments];
  const filters = [];
  Session.find = (filter) => { filters.push(filter); return chain([]); };
  Session.countDocuments = async () => 0;
  try {
    await getSessions({ user: { role: 'BRANCH_ADMIN', branchId: branchA }, query: { branchId: branchB } }, response());
    assert.equal(String(filters.at(-1).branchId), branchA);
    await getSessions({ user: { role: 'OWNER' }, query: { branchId: branchB } }, response());
    assert.equal(String(filters.at(-1).branchId), branchB);
    await getSessions({ user: { role: 'OWNER' }, query: {} }, response());
    assert.deepEqual(filters.at(-1), {});
    const res = response();
    await getSessions({ user: { role: 'OWNER' }, query: { branchId: 'not-an-id' } }, res);
    assert.equal(res.statusCode, 400);
  } finally { [Session.find, Session.countDocuments] = originals; }
});

test('kiosk token authenticates by hash and rejects missing, unknown and disabled kiosks', async () => {
  const { Kiosk } = require('../dist/models/kiosk.model');
  const { kioskAuth, hashKioskToken, generateKioskToken } = require('../dist/middlewares/kiosk.middleware');
  const originals = [Kiosk.findOne, Kiosk.updateOne];
  const token = generateKioskToken();
  assert.match(token, /^bpk_[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(hashKioskToken(token), token);
  let active = true;
  Kiosk.findOne = async (query) => query.tokenHash === hashKioskToken(token) ? { _id: kioskId, branchId: branchA, isActive: active } : null;
  Kiosk.updateOne = async () => ({});
  try {
    const req = { headers: { 'x-kiosk-token': token } };
    let called = false;
    await kioskAuth(req, response(), () => { called = true; });
    assert.equal(called, true);
    assert.equal(String(req.kiosk.branchId), branchA);
    for (const [headers, code, errorCode] of [[{}, 401, 'KIOSK_UNREGISTERED'], [{ 'x-kiosk-token': 'bpk_wrong' }, 401, 'KIOSK_TOKEN_INVALID']]) {
      const res = response();
      await kioskAuth({ headers }, res, () => assert.fail('must not pass'));
      assert.equal(res.statusCode, code);
      assert.equal(res.body.code, errorCode, 'kiosk app relies on the code to redirect to /setup');
    }
    active = false;
    const res = response();
    await kioskAuth({ headers: { 'x-kiosk-token': token } }, res, () => assert.fail('disabled kiosk must not pass'));
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, 'KIOSK_DISABLED');
  } finally { [Kiosk.findOne, Kiosk.updateOne] = originals; }
});

test('sessions and transactions record the kiosk branch at the time they are created', async () => {
  const { PricingPackage } = require('../dist/models/pricing.model');
  const { Session } = require('../dist/models/session.model');
  const { Transaction } = require('../dist/models/transaction.model');
  const payment = require('../dist/services/payment.service');
  const { createSession } = require('../dist/controllers/session.controller');
  const { createTransaction } = require('../dist/controllers/transaction.controller');
  const originals = [PricingPackage.findById, Session.create, Session.findById, Transaction.findOne, Transaction.create, payment.createQrisTransaction];
  let createdSession; let createdTransaction;
  PricingPackage.findById = async () => ({ isActive: true, price: 50000 });
  Session.create = async (doc) => { createdSession = doc; return { _id: 's1', ...doc }; };
  Session.findById = () => chain({ _id: 's1', status: 'PENDING', finalPrice: 50000, branchId: branchA, kioskId });
  Transaction.findOne = async () => null;
  Transaction.create = async (doc) => { createdTransaction = doc; return doc; };
  payment.createQrisTransaction = async () => ({ qrUrl: 'https://qr', externalId: 'ext' });
  try {
    await createSession({ body: { packageId: new Types.ObjectId().toString() }, kiosk: { _id: kioskId, branchId: branchA } }, response());
    assert.equal(String(createdSession.branchId), branchA);
    assert.equal(String(createdSession.kioskId), kioskId);
    await createTransaction({ body: { sessionId: 's1' }, kiosk: { _id: kioskId, branchId: branchB } }, response());
    assert.equal(String(createdTransaction.branchId), branchA, 'transaction follows session branch even if kiosk moved since');
    assert.equal(String(createdTransaction.kioskId), kioskId);
  } finally {
    [PricingPackage.findById, Session.create, Session.findById, Transaction.findOne, Transaction.create, payment.createQrisTransaction] = originals;
  }
});

test('another kiosk cannot start or complete a session it does not own', async () => {
  const { Session } = require('../dist/models/session.model');
  const { completeSession, startSession } = require('../dist/controllers/session.controller');
  const original = Session.findById;
  Session.findById = async () => ({ _id: 's1', status: 'IN_PROGRESS', kioskId: new Types.ObjectId(kioskId), save: async () => assert.fail('must not save') });
  try {
    for (const handler of [completeSession, startSession]) {
      const res = response();
      await handler({ params: { id: 's1' }, body: {}, kiosk: { _id: new Types.ObjectId(), branchId: branchA } }, res);
      assert.equal(res.statusCode, 403);
    }
  } finally { Session.findById = original; }
});

test('moving a kiosk records assignment history without rewriting past records', async () => {
  const { Kiosk } = require('../dist/models/kiosk.model');
  const { Branch } = require('../dist/models/branch.model');
  const { Session } = require('../dist/models/session.model');
  const { Transaction } = require('../dist/models/transaction.model');
  const { moveKiosk } = require('../dist/controllers/kiosk.controller');
  const originals = [Kiosk.findById, Branch.findById, Session.updateMany, Transaction.updateMany];
  const kiosk = { _id: kioskId, branchId: new Types.ObjectId(branchA), assignments: [{ branchId: new Types.ObjectId(branchA) }], save: async () => {}, toJSON() { return this; } };
  Kiosk.findById = async () => kiosk;
  Branch.findById = async (id) => (String(id) === branchB ? { _id: id, isActive: true } : null);
  Session.updateMany = Transaction.updateMany = async () => assert.fail('history must not be rewritten');
  try {
    const res = response();
    await moveKiosk({ params: { id: kioskId }, body: { branchId: branchB }, user: { id: 'owner', role: 'OWNER' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(String(kiosk.branchId), branchB);
    assert.equal(kiosk.assignments.length, 2);
    assert.equal(String(kiosk.assignments.at(-1).branchId), branchB);
    const missing = response();
    await moveKiosk({ params: { id: kioskId }, body: { branchId: new Types.ObjectId().toString() }, user: { id: 'owner', role: 'OWNER' } }, missing);
    assert.equal(missing.statusCode, 404);
  } finally { [Kiosk.findById, Branch.findById, Session.updateMany, Transaction.updateMany] = originals; }
});

test('analytics pipelines are restricted to the requested branch as ObjectId', async () => {
  const { Transaction } = require('../dist/models/transaction.model');
  const { Session } = require('../dist/models/session.model');
  const { getDashboardAnalytics } = require('../dist/services/analytics.service');
  const originals = [Transaction.aggregate, Session.aggregate, Session.find];
  let txPipeline; let sessionPipeline; let findFilter;
  Transaction.aggregate = async (p) => { txPipeline = p; return [{ total: [], today: [], days: [], undated: [], packages: [] }]; };
  Session.aggregate = async (p) => { sessionPipeline = p; return []; };
  Session.find = (f) => { findFilter = f; return chain([]); };
  try {
    await getDashboardAnalytics(new Date('2026-10-30T05:00:00Z'), { branchId: new Types.ObjectId(branchA) });
    assert.ok(txPipeline[0].$match.branchId instanceof Types.ObjectId);
    assert.equal(String(txPipeline[0].$match.branchId), branchA);
    assert.equal(String(sessionPipeline[0].$match.branchId), branchA);
    assert.equal(String(findFilter.branchId), branchA);
  } finally { [Transaction.aggregate, Session.aggregate, Session.find] = originals; }
});

test('branch admins get 403 on owner-only configuration routes over HTTP', async () => {
  const express = require('express');
  const { Admin } = require('../dist/models/admin.model');
  const original = Admin.findById;
  Admin.findById = () => chain({ _id: 'a2', email: 'b@example.com', role: 'BRANCH_ADMIN', branchId: branchA });
  const app = express();
  app.use(express.json());
  app.use('/api/vouchers', require('../dist/routes/voucher.routes').default);
  app.use('/api/admins', require('../dist/routes/admin.routes').default);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = { authorization: `Bearer ${jwt.sign({ id: 'a2', email: 'b@example.com' }, 'test-only')}`, 'content-type': 'application/json' };
    assert.equal((await fetch(`${base}/api/vouchers`, { headers })).status, 403);
    assert.equal((await fetch(`${base}/api/admins`, { method: 'POST', headers, body: '{}' })).status, 403);
  } finally {
    Admin.findById = original;
    await new Promise(resolve => server.close(resolve));
  }
});
