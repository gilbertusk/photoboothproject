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
