import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('mock payment is restricted to development and never auto-pays outside it', () => {
  const source = read('backend/src/services/payment.service.ts')

  assert.match(source, /env\.NODE_ENV\s*!==\s*'development'/)
  assert.doesNotMatch(source, /elapsed\s*>\s*5000/)
})

test('missing email configuration fails visibly instead of reporting mock success', () => {
  const source = read('backend/src/services/email.service.ts')

  assert.match(source, /throw new Error\([^)]*RESEND_API_KEY/)
  assert.doesNotMatch(source, /\[EMAIL MOCK\]/)
})

test('dashboard pages never substitute dummy business data', () => {
  const pages = [
    'dashboard/src/pages/DashboardPage.tsx',
    'dashboard/src/pages/TemplatesPage.tsx',
    'dashboard/src/pages/PricingPage.tsx',
    'dashboard/src/pages/TransactionsPage.tsx',
    'dashboard/src/pages/VouchersPage.tsx',
  ]

  for (const page of pages) {
    const source = read(page)
    assert.doesNotMatch(source, /DUMMY_|dummyTransactions|defaultChartData|defaultPackages/i, page)
  }
})
