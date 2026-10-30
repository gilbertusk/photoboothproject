# Phase 4.1: branches, admin roles, kiosk identity

## Scope

- `Branch` model. Kiosks belong to one branch at a time and can be moved; each move appends to
  `Kiosk.assignments`. Past sessions, transactions and media keep the `branchId`/`kioskId`
  stamped when they were created. Transactions copy the branch from their session.
- Admin roles: `OWNER` (all branches, all configuration) and `BRANCH_ADMIN` (dashboard,
  transactions, sessions, own branch's kiosks). Admins without a role are owners.
- Role and branch are re-read from MongoDB on every authenticated request, so demotion or
  deletion takes effect immediately rather than when the JWT expires.
- Owner-only API: pricing, templates, vouchers, settings, uploads, bookings admin, customers,
  notifications, testimonials admin, admins, branch create/update/delete, kiosk create/move/token.
  The dashboard hides these menus for branch admins; the API is the enforcement point.
- Kiosk identity: `x-kiosk-token: bpk_...`. Only the SHA-256 hash is stored; the plain token is
  shown once on registration or rotation. Failures return `code` `KIOSK_UNREGISTERED`,
  `KIOSK_TOKEN_INVALID` (401) or `KIOSK_DISABLED` (403); the kiosk app redirects to `/setup`.
- A session created by a kiosk can only be started, completed or paid by that kiosk.

## Rollout

1. Deploy backend. Existing admins become owners; existing records have no branch.
2. Owner creates branches in **Cabang & Kiosk**, then registers each kiosk and copies its token.
3. On each kiosk open `/setup`, paste the token, confirm the branch name shown.
4. Set `KIOSK_AUTH_REQUIRED=true` (default in production) once every kiosk is connected.
   Until then, unregistered kiosks keep working but their records have no branch.
5. Create branch admins in **Admin**.

Records created before rollout show under "Semua cabang" only.

## Evidence

RED checkpoint `1a8103a`: 9 runtime tests failed before implementation.

Tests: `backend/tests/branches.test.cjs` covers DB-backed roles over stale token claims,
deleted admins, legacy default role, owner guard, branch-pinned listing for branch admins,
invalid branch filters, token hashing and rejection codes, disabled kiosks, branch stamping
at creation, transaction following the session branch after a kiosk move, cross-kiosk
session protection, move history without rewriting past records, branch-scoped analytics
pipelines, and HTTP 403 for branch admins on owner-only routes.

Verified: backend build, `node --test` for backend (21/21) and root (36/36) suites, dashboard
and kiosk production builds, ESLint clean on new/changed Phase 4.1 frontend files.

## Not verified

No live MongoDB or real devices. Owner-only booking/customer data means branch admins cannot
see event bookings. `GET /api/sessions/:id` and `GET /api/transactions/:sessionId` remain
unauthenticated for kiosk polling. Kiosk tokens live in `localStorage`; anyone with the device
can read them, so rotate the token if a device is lost.
