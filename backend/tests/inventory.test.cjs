const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.JWT_SECRET = 'test-only';
process.env.KIOSK_AUTH_REQUIRED = 'true';

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
const dupError = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

function stub(target, patches) {
  const originals = Object.fromEntries(Object.keys(patches).map((k) => [k, target[k]]));
  Object.assign(target, patches);
  return () => Object.assign(target, originals);
}

test('print is recorded once per attempt; later attempts are reprints stamped with the kiosk branch', async () => {
  const { Session } = require('../dist/models/session.model');
  const { PrintJob } = require('../dist/models/print-job.model');
  const { InventoryItem } = require('../dist/models/inventory-item.model');
  const { InventoryMovement } = require('../dist/models/inventory-movement.model');
  const { recordPrint } = require('../dist/controllers/inventory.controller');

  const sessionId = new Types.ObjectId().toString();
  const paper = { _id: new Types.ObjectId(), name: 'Kertas 4R', perPrint: 1, lowStockThreshold: 5 };
  const jobs = [];
  const ledger = [];
  const restore = [
    stub(Session, { findById: async () => ({ _id: sessionId, status: 'PAID', kioskId: new Types.ObjectId(kioskId) }) }),
    stub(PrintJob, {
      exists: async (q) => (jobs.some((j) => String(j.sessionId) === String(q.sessionId)) ? { _id: 'x' } : null),
      create: async (doc) => {
        if (jobs.some((j) => j.attemptId === doc.attemptId && String(j.kioskId) === String(doc.kioskId))) throw dupError();
        const job = { _id: new Types.ObjectId(), ...doc };
        jobs.push(job);
        return job;
      },
      findOne: (q) => chain(jobs.find((j) => j.attemptId === q.attemptId && String(j.kioskId) === String(q.kioskId)) ?? null),
    }),
    stub(InventoryItem, { find: () => chain([paper]) }),
    stub(InventoryMovement, {
      insertMany: async (docs) => {
        const dups = docs.filter((d) => ledger.some((l) => l.idempotencyKey === d.idempotencyKey));
        docs.filter((d) => !dups.includes(d)).forEach((d) => ledger.push(d));
        if (dups.length) throw Object.assign(new Error('bulk'), { code: 11000, writeErrors: dups.map(() => ({ code: 11000 })) });
        return docs;
      },
      aggregate: async () => [{ _id: paper._id, quantity: 6 + ledger.reduce((s, l) => s + l.delta, 0) }],
    }),
  ];
  const kiosk = { _id: new Types.ObjectId(kioskId), branchId: new Types.ObjectId(branchA) };
  try {
    const first = response();
    await recordPrint({ body: { sessionId, attemptId: 'attempt-0001' }, kiosk }, first);
    assert.equal(first.statusCode, 201);
    assert.equal(first.body.data.kind, 'PRINT');
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].delta, -1);
    assert.equal(ledger[0].kind, 'PRINT');
    assert.equal(String(ledger[0].branchId), branchA);
    assert.equal(String(ledger[0].sessionId), sessionId);

    const retry = response();
    await recordPrint({ body: { sessionId, attemptId: 'attempt-0001' }, kiosk }, retry);
    assert.equal(retry.statusCode, 200);
    assert.equal(retry.body.data.duplicate, true);
    assert.equal(ledger.length, 1, 'network retry must not deduct stock twice');

    const reprint = response();
    await recordPrint({ body: { sessionId, attemptId: 'attempt-0002' }, kiosk }, reprint);
    assert.equal(reprint.body.data.kind, 'REPRINT');
    assert.equal(ledger.length, 2);
    assert.equal(ledger[1].kind, 'REPRINT');
    assert.deepEqual(reprint.body.data.lowStock.map((i) => i.name), ['Kertas 4R'], '4 left with threshold 5 is low');
  } finally { restore.forEach((r) => r()); }
});

test('prints are refused for foreign, unpaid, or malformed sessions', async () => {
  const { Session } = require('../dist/models/session.model');
  const { recordPrint } = require('../dist/controllers/inventory.controller');
  const kiosk = { _id: new Types.ObjectId(kioskId), branchId: new Types.ObjectId(branchA) };
  const sessionId = new Types.ObjectId().toString();
  let session;
  const restore = stub(Session, { findById: async () => session });
  try {
    const cases = [
      [{ _id: sessionId, status: 'PAID', kioskId: new Types.ObjectId() }, { sessionId, attemptId: 'attempt-0001' }, 403],
      [{ _id: sessionId, status: 'PENDING', kioskId: kiosk._id }, { sessionId, attemptId: 'attempt-0001' }, 409],
      [null, { sessionId, attemptId: 'attempt-0001' }, 404],
      [null, { sessionId, attemptId: 'x' }, 400],
      [null, { sessionId: 'nope', attemptId: 'attempt-0001' }, 400],
    ];
    for (const [s, body, code] of cases) {
      session = s;
      const res = response();
      await recordPrint({ body, kiosk }, res);
      assert.equal(res.statusCode, code, JSON.stringify(body));
    }
  } finally { restore(); }
});

test('inventory list derives balances from the ledger and pins branch admins to their branch', async () => {
  const { Kiosk } = require('../dist/models/kiosk.model');
  const { InventoryItem } = require('../dist/models/inventory-item.model');
  const { InventoryMovement } = require('../dist/models/inventory-movement.model');
  const { getInventory } = require('../dist/controllers/inventory.controller');
  const itemId = new Types.ObjectId();
  let kioskFilter; let itemFilter;
  const restore = [
    stub(Kiosk, { find: (f) => { kioskFilter = f; return chain([{ _id: new Types.ObjectId(kioskId), name: 'Booth 1', isActive: true, branchId: { _id: branchA, name: 'Jakarta', code: 'JKT' } }]); } }),
    stub(InventoryItem, { find: (f) => { itemFilter = f; return chain([{ _id: itemId, kioskId: new Types.ObjectId(kioskId), name: 'Kertas', unit: 'lembar', perPrint: 1, lowStockThreshold: 5, isActive: true }]); } }),
    stub(InventoryMovement, { aggregate: async () => [{ _id: itemId, quantity: 3 }] }),
  ];
  try {
    const res = response();
    await getInventory({ user: { role: 'BRANCH_ADMIN', branchId: branchA }, query: { branchId: branchB } }, res);
    assert.equal(String(kioskFilter.branchId), branchA);
    assert.equal(String(itemFilter.kioskId.$in[0]), kioskId);
    const [row] = res.body.data;
    assert.equal(row.name, 'Booth 1');
    assert.equal(row.items[0].quantity, 3);
    assert.equal(row.items[0].lowStock, true);
  } finally { restore.forEach((r) => r()); }
});

test('restock and stock count are idempotent ledger entries scoped to the admin branch', async () => {
  const { Kiosk } = require('../dist/models/kiosk.model');
  const { InventoryItem } = require('../dist/models/inventory-item.model');
  const { InventoryMovement } = require('../dist/models/inventory-movement.model');
  const { restockItem, adjustItem } = require('../dist/controllers/inventory.controller');
  const itemId = new Types.ObjectId();
  const ledger = [];
  const restore = [
    stub(InventoryItem, { findById: async () => ({ _id: itemId, kioskId: new Types.ObjectId(kioskId), name: 'Kertas' }) }),
    stub(Kiosk, { findOne: async (f) => (!f.branchId || String(f.branchId) === branchA ? { _id: new Types.ObjectId(kioskId), branchId: new Types.ObjectId(branchA) } : null) }),
    stub(InventoryMovement, {
      create: async (doc) => { if (ledger.some((l) => l.idempotencyKey === doc.idempotencyKey)) throw dupError(); ledger.push(doc); return doc; },
      aggregate: async () => [{ _id: itemId, quantity: 12 + ledger.reduce((s, l) => s + l.delta, 0) }],
    }),
  ];
  const admin = { id: new Types.ObjectId().toString(), role: 'BRANCH_ADMIN', branchId: branchA };
  try {
    const bad = response();
    await restockItem({ params: { id: String(itemId) }, body: { quantity: 0, requestId: 'req-00001' }, user: admin, query: {} }, bad);
    assert.equal(bad.statusCode, 400);

    const ok = response();
    await restockItem({ params: { id: String(itemId) }, body: { quantity: 20, requestId: 'req-00001' }, user: admin, query: {} }, ok);
    assert.equal(ok.statusCode, 201);
    assert.equal(ledger.at(-1).delta, 20);
    assert.equal(ledger.at(-1).kind, 'RESTOCK');
    assert.equal(String(ledger.at(-1).adminId), admin.id);
    assert.equal(String(ledger.at(-1).branchId), branchA);

    const again = response();
    await restockItem({ params: { id: String(itemId) }, body: { quantity: 20, requestId: 'req-00001' }, user: admin, query: {} }, again);
    assert.equal(again.body.data.duplicate, true);
    assert.equal(ledger.length, 1, 'double submit must not add stock twice');

    const count = response();
    await adjustItem({ params: { id: String(itemId) }, body: { countedQuantity: 7, note: 'Stock opname', requestId: 'req-00002' }, user: admin, query: {} }, count);
    assert.equal(count.statusCode, 201);
    assert.equal(ledger.at(-1).kind, 'ADJUST');
    assert.equal(ledger.at(-1).delta, 7 - 32, 'adjust records the difference to the counted quantity');

    const foreign = response();
    await restockItem({ params: { id: String(itemId) }, body: { quantity: 5, requestId: 'req-00003' }, user: { ...admin, branchId: branchB }, query: {} }, foreign);
    assert.equal(foreign.statusCode, 404);
  } finally { restore.forEach((r) => r()); }
});

test('ledger rejects updates and deletes', { timeout: 5000 }, async () => {
  const { InventoryMovement } = require('../dist/models/inventory-movement.model');
  await assert.rejects(InventoryMovement.updateOne({}, { delta: 0 }).exec(), /append-only/);
  await assert.rejects(InventoryMovement.deleteMany({}).exec(), /append-only/);
  await assert.rejects(InventoryMovement.findOneAndUpdate({}, { delta: 0 }).exec(), /append-only/);
});

test('print endpoint requires a kiosk token and inventory requires admin login over HTTP', async () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/inventory', require('../dist/routes/inventory.routes').default);
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const print = await fetch(`${base}/api/inventory/prints`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(print.status, 401);
    assert.equal((await print.json()).code, 'KIOSK_UNREGISTERED');
    assert.equal((await fetch(`${base}/api/inventory`)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
