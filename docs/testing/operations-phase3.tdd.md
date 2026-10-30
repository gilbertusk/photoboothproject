# Phase 3: server analytics and transactional notifications

## Scope

- Dashboard totals are MongoDB aggregations, not a client-side sample of 1,000 sessions.
- Kiosk revenue uses PAID transactions and their `paidAt`, with Asia/Jakarta day boundaries.
- Event booking revenue remains separate to avoid mixing payment systems or double-counting.
- Popular packages are paid kiosk transactions this calendar month. Completed sessions only
  count COMPLETED; IN_PROGRESS sessions do not disappear from paid revenue.
- Paid transactions without a payment timestamp count toward lifetime revenue only; the UI
  explicitly reports their exclusion from dated metrics.
- Booking received/confirmed emails are queued after booking mutations. Confirmed upcoming
  events get reminders within 24 hours, while the backend worker is running.
- The admin notification page shows provider acceptance, failures, and retry controls.

## Configuration

Set these backend environment variables, then restart the backend:

```dotenv
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=bertpixx <bookings@your-verified-domain.example>
NOTIFICATIONS_ENABLED=true
```

The worker is disabled by default. Notifications are still queued and visible to admins.
Use a verified sender domain for real recipients; the Resend onboarding sender is limited.
The worker polls every minute, with up to 20 delivery attempts per tick per process.
Provider failures become FAILED and require an admin retry. SENT means provider acceptance,
not inbox delivery. Crash-interrupted deliveries become FAILED after ten minutes: verify the
provider record before retrying because provider idempotency has a finite retention window.
The immutable payload key prevents ordinary duplicate submissions and makes retries stable.
Changed or cancelled bookings invalidate old queued messages before delivery.

## Evidence

RED checkpoint `e0fa800`: photo email silently accepted a provider error; the seven-day
analytics helper did not exist. Runtime tests were executed before implementation.

Tests: `backend/tests/operations.test.cjs` exercises provider error responses, WIB boundaries,
notification key stability, failed/successful/cancelled delivery, reminder selection,
server-total response shaping, and actual HTTP authentication on the new routes.
Database and provider methods are mocked; no real customer email is sent by tests.

## Remaining verification and scope

Live MongoDB pipeline execution, real provider delivery, browser E2E, and coverage measurement
are not part of these tests. Booking persistence and queue insertion are separate database
writes; an outbox insertion failure is logged and needs operational recovery. This is not a
transactional database outbox guarantee. Bulk email campaigns are not implemented in this pass.
