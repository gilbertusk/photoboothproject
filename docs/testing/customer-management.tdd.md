# Customer management verification

Journeys derived from the approved Phase 3 roadmap: admins browse customer pages,
edit contacts, inspect paginated booking history, and synchronize existing bookings.
New bookings and payment changes update customer summaries.

## RED

`npm run build` (backend), then `node --test tests/customers.test.cjs`:
3 failures reproduced missing booking amounts, duplicate normalized email groups,
and invalid pagination reaching the database. Checkpoint: `96a4b3b`.

## GREEN

- Backend `npm run build`: passed.
- Backend `node --test tests/customers.test.cjs`: 5/5 passed.
- Dashboard `npm run build`: passed (TypeScript project build and Vite).
- Kiosk `npm run build`: passed (TypeScript project build, Vite and PWA).
- Root `node --test tests/*.test.mjs`: 36/36 passed.
- `git diff --check`: passed before this documentation-only addition.

Runtime tests exercise Mongoose document serialization and controller/service logic
with mocked database methods. They verify amount persistence, normalized email,
legacy missing amounts, pagination validation, second-page offsets, filtered totals,
literal search, retry-safe total replacement, and clearing totals after the last booking.
The older root tests inspect source patterns and are not end-to-end evidence.

## Limitations

No live MongoDB, browser flow, email delivery, or printer was tested in this pass.
Coverage percentage has not been measured. Frontend bundles retain size warnings.
Historical booking amounts missing before the schema fix cannot be reconstructed
from current package prices: they are shown as unrecorded and excluded from spend.
Customer summaries are derived caches; refresh errors are logged, and admin sync
can repair them. Synchronization preserves edited contact fields.
Notifications and server-side dashboard analytics are still pending Phase 3 work.
