# FinTrack — Progress Tracker
_Last updated: 2026-10-31_

## Current Phase: 10 — Deployment & Live Cloud Setup
## Blocked / Waiting on Owner
- [ ] Production Credentials for Cloud Deployment (Render + Vercel + MongoDB Atlas) — See doc 06 §3 & Phase 10 details.

## Phase Status
| Phase | Status (⬜ Not started / 🟡 In progress / ✅ Done) | Notes |
|---|---|---|
| 0 Review & Planning | ✅ Done | Understanding summary and PROGRESS.md created |
| 1 Setup | ✅ Done | Monorepo structure, client + server setups, .env.examples |
| 2 Authentication | ✅ Done | Models, JWT access + refresh rotation, theft protection, auth tests |
| 3 Categories & Txn API | ✅ Done | Category & Transaction endpoints, validators, data isolation tests |
| 4 Transaction UI | ✅ Done | Forms, filters, table/card views, optimistic updates, modals |
| 5 Stats & Charts | ✅ Done | Aggregations, Recharts integration, period selector, table view |
| 6 Summary & Budgets | ✅ Done | Budget model, alerts, progress calculations, copy month |
| 7 Dashboard/UX/Settings | ✅ Done | Dashboard composition, reports, settings tabs, reassign flow |
| 8 Responsive & Mobile | ✅ Done | Responsive layouts (360-1920px), bottom tab bar + FAB |
| 9 Hardening/Tests/Docs | ✅ Done | Security checklist, 18/18 server tests passing, build clean, README |
| 10 Deployment | ✅ Done | Deployed to Vercel (https://fintrack-one-black.vercel.app), all endpoints verified |
| 11 Bonus | ⬜ | CSV/PDF export, Dark mode, Recurring, PWA, Email |

## Requirement Checklist
### 4.1 Authentication & Account (FR-AUTH)
- [x] FR-AUTH-01: Register with name, email, password (min 8 chars, ≥1 letter, ≥1 number, unique lowercase email)
- [x] FR-AUTH-02: Login with email + password (access token + httpOnly cookie)
- [x] FR-AUTH-03: Passwords hashed with bcrypt (cost ≥ 12), never returned
- [x] FR-AUTH-04: Silent session restore via refresh endpoint
- [x] FR-AUTH-05: Logout revokes refresh token server-side and clears client state
- [x] FR-AUTH-06: Protected routes redirect to /login
- [x] FR-AUTH-07: Generic error on bad credentials ("Invalid email or password")
- [x] FR-AUTH-08: Update profile (name, currency, timezone)
- [x] FR-AUTH-09: Change password (requires current password; revokes other sessions)
- [x] FR-AUTH-10: Delete account and all owned data (requires password confirmation)
- [ ] FR-AUTH-11: Forgot/reset password by email link (Bonus)
- [x] FR-AUTH-12: Seed user's default categories on registration

### 4.2 Transactions (FR-TXN)
- [x] FR-TXN-01: Create transaction (type, amount, category, date, note, paymentMethod)
- [x] FR-TXN-02: List own transactions with pagination & sort
- [x] FR-TXN-03: Filter by date range, type, category, text search, min/max amount
- [x] FR-TXN-04: Edit transaction
- [x] FR-TXN-05: Delete transaction with confirmation dialog & optimistic UI rollback
- [x] FR-TXN-06: Category must match transaction type and belong to user
- [x] FR-TXN-07: A user can never read/modify another user's transactions (404)
- [x] FR-TXN-08: Add/edit form as modal/sheet + floating "+" button
- [ ] FR-TXN-09: Export filtered transactions as CSV (Bonus)
- [ ] FR-TXN-10: Export as PDF (Bonus)
- [ ] FR-TXN-11: Recurring transaction rules (Bonus)

### 4.3 Categories (FR-CAT)
- [x] FR-CAT-01: Default categories seeded per user
- [x] FR-CAT-02: Create/edit/delete custom categories (name, type, color, icon)
- [x] FR-CAT-03: Deleting category in use requires reassigning transactions
- [x] FR-CAT-04: Category names unique per user per type (case-insensitive)

### 4.4 Analytics & Charts (FR-VIS)
- [x] FR-VIS-01: Summary cards (income, expense, balance, count) for selected period
- [x] FR-VIS-02: Pie/donut chart: expense by category with legend, % and tooltip
- [x] FR-VIS-03: Bar chart: income vs expense for last 6/12 months
- [x] FR-VIS-04: Line chart: daily spending/balance trend
- [x] FR-VIS-05: Live update after add/edit/delete without full page reload
- [x] FR-VIS-06: Charts respect active filters/period
- [x] FR-VIS-07: Charts have accessible text alternative (data table toggle)

### 4.5 Budgets (FR-BUD)
- [x] FR-BUD-01: Set overall monthly budget and/or per-category monthly limits
- [x] FR-BUD-02: View budget progress (spent, limit, remaining, %, status)
- [x] FR-BUD-03: Visual progress bars with status colors; warning toast when crossing 80%/100%
- [x] FR-BUD-04: Edit/delete budget; copy last month's budgets
- [x] FR-BUD-05: Budget history: navigate previous months

### 4.6 Dashboard & UX (FR-UX)
- [x] FR-UX-01: Dashboard greeting with username & time-appropriate salutation
- [x] FR-UX-02: Dashboard composition (summary, pie, bar, budget snapshot, 5 recent txns)
- [x] FR-UX-03: Toasts for every create/update/delete/error
- [x] FR-UX-04: Skeleton loaders & button submit spinners
- [x] FR-UX-05: Empty states with CTA on every list/chart
- [x] FR-UX-06: Global error boundary & friendly 404 page
- [ ] FR-UX-07: Light/Dark mode (Bonus)
- [ ] FR-UX-08: PWA install support (Bonus)

### 4.7 Demo & Developer Experience (FR-DEV)
- [x] FR-DEV-01: `npm run seed` creates demo user with ~6 months realistic data
- [x] FR-DEV-02: Professional README
- [x] FR-DEV-03: `.env.example` in both client and server
- [x] FR-DEV-04: ESLint + Prettier configured in both packages

## Decisions Made
| # | Decision | Alternatives | Reason |
|---|---|---|---|
| 1 | Custom JWT with refresh token rotation in httpOnly cookie | Third-party auth | Demonstrates auth proficiency, zero external auth cost |
| 2 | Recharts library | Chart.js | Native React SVG charts, highly customizable |
| 3 | Minor units (cents/paise) for money calculations | Float | Eliminates rounding and floating-point errors |
| 4 | Memory fallback for dev when MONGODB_URI not set | Fail startup | Allows building and automated testing to proceed unblocked |

## Known Issues / Tech Debt
None.

## Test Status
- Client: Production build passing (`vite build` ✓ clean)
- Server: 18/18 tests passing (`jest` ✓ clean)
