# Phase 4.2: per-kiosk inventory

## Scope

- `InventoryItem` per kiosk (paper, ribbon...) with `perPrint` usage and a low-stock threshold.
- `InventoryMovement` is an append-only ledger: `PRINT`, `REPRINT`, `RESTOCK`, `ADJUST`.
  Quantity is the sum of `delta`; updates and deletes are rejected by schema hooks.
  Each movement stores the kiosk's branch at that moment, so moving a kiosk keeps history.
- The kiosk reports every print with `POST /api/inventory/prints` (`x-kiosk-token` required)
  and a client-generated `attemptId`. `PrintJob` is unique per kiosk + attempt; movement keys
  are `print:<job>:<item>`, so retries never deduct twice and also repair a partial write.
  The first job of a session is `PRINT`, later ones `REPRINT`.
- Only sessions owned by the kiosk and in `PAID`, `IN_PROGRESS` or `COMPLETED` can be printed.
- Restock and stock count (`ADJUST` = counted − ledger) carry a client `requestId`, so a
  double-submitted form is recorded once. Stock count corrects drift without editing history.
- Dashboard **Stok**: per-kiosk balances, low-stock badge, negative-stock warning, history,
  restock, stock count, add/stop tracking items. Branch admins see and manage their branch only.

## Limits

- Browsers do not report whether the print dialog was cancelled; every attempt is counted.
  Use stock count to correct.
- Prints from kiosks without a token are not tracked. Print reports retry 3 times, then drop;
  offline queueing arrives in Phase 4.3.
- Stock may go negative (prints are never blocked by stock), shown as a warning.

## Evidence

RED checkpoint `9f97fa0`: 6 runtime tests failed before implementation.

Tests: `backend/tests/inventory.test.cjs` covers print vs reprint, retry idempotency, branch
stamping, low-stock reporting, refusal for foreign/unpaid/missing/malformed sessions,
ledger-derived balances with branch-admin pinning, idempotent restock, stock-count delta,
cross-branch 404, append-only ledger hooks, and HTTP auth for kiosk and admin routes.

No live MongoDB or physical printer tested.
