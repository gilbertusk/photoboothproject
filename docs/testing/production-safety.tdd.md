# Production safety TDD evidence

## Source

Journeys were derived from the production-readiness follow-up requested in chat.

## User journeys

- As an operator, I want missing Midtrans credentials to fail outside development so a production order cannot silently use a mock payment.
- As an operator, I want missing Resend credentials to return an error so the UI cannot claim that an email was sent when it was not.
- As an administrator, I want the dashboard to show real empty/error states so sample records cannot be mistaken for production data.

## Task report

| Behavior | RED evidence | GREEN evidence | Guarantee |
|---|---|---|---|
| Payment mocks are development-only | `node --test tests/production-safety.test.mjs` failed because no environment guard existed and mock IDs auto-paid unconditionally | Same command passed after adding environment guards | Missing Midtrans configuration and mock IDs throw outside development; five-second auto-pay remains development-only |
| Missing email configuration fails visibly | Test failed because the service logged `[EMAIL MOCK]` and returned success | Test passed after replacing the mock-success path with an error | The send-email endpoint reaches the global error handler when `RESEND_API_KEY` is absent |
| Dashboard has no sample business-data fallback | Test failed on all five dashboard data pages | Test passed after removing fixture arrays and simulated mutations | Dashboard, templates, packages, transactions, and vouchers use server data only and render empty/error states when unavailable |

## Test specification

| # | What is guaranteed | Test/command | Type | Result |
|---|---|---|---|---|
| 1 | Mock payments cannot be created or checked outside development | `tests/production-safety.test.mjs` | Regression | PASS |
| 2 | Mock payments auto-complete after five seconds only in development | `tests/production-safety.test.mjs` | Regression | PASS |
| 3 | Missing Resend configuration throws rather than reporting success | `tests/production-safety.test.mjs` | Regression | PASS |
| 4 | Dashboard data pages contain no dummy fallback datasets | `tests/production-safety.test.mjs` | Regression | PASS |
| 5 | Backend remains type-safe | `npx tsc --noEmit` in `backend` | Compile | PASS |
| 6 | Dashboard remains type-safe and production-buildable | `npm run build` in `dashboard` | Build | PASS |

## Coverage and known gaps

The repository had no test runner or coverage setup. The regression suite uses Node's built-in test runner and validates the safety policies directly against their production source. No percentage coverage report is available. End-to-end payment, email delivery, and authenticated dashboard API flows still require configured external services.
