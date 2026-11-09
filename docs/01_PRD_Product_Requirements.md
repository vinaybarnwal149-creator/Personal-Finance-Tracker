# 01 — Product Requirements Document (PRD)
**Project:** FinTrack — Personal Finance Tracker (working name; owner may rename)
**Version:** 1.0 | **Status:** Approved for development
**Read order:** 01 PRD → 02 UI/UX → 03 Architecture → 04 Database & API → 05 Roadmap → 06 Security/Testing/Deployment → 07 Inputs Checklist

---

## 1. Product Summary
FinTrack is a responsive full-stack web application that lets individuals record income and expenses, categorize them, visualize spending with charts, set monthly budgets, and see their financial position at a glance. Every user sees only their own data behind secure login.

**Primary goal:** a production-quality portfolio/real-world app demonstrating JWT auth, REST API design, MongoDB modeling, React state management, data visualization, responsive UI, and cloud deployment.

## 2. Target Users
| Persona | Description | Needs |
|---|---|---|
| Everyday tracker (primary) | Salaried/student user, 18–45, uses phone and laptop | Fast entry of transactions, clear monthly picture |
| Budget-conscious planner | Wants limits per category | Budget vs. actual with warnings |
| Reviewer/recruiter (secondary) | Evaluates the project | Clean UI, live demo, professional README, demo account |

## 3. Scope
### 3.1 In Scope (MVP — must ship)
1. Registration, login, logout, protected routes, persistent session (refresh)
2. Transaction CRUD (income/expense) with categories, notes, date, payment method
3. Category management (defaults + custom)
4. Transaction list with filters (date range, category, type, search), sorting, pagination
5. Summary cards: Total Income, Total Expense, Balance (period-aware)
6. Charts: expense-by-category pie/donut, monthly income-vs-expense bar, balance/spending line trend
7. Budgets: monthly overall and per-category limits with progress and warnings
8. Dashboard: greeting, summary cards, charts, recent transactions, budget snapshot
9. Profile/settings: name, currency, timezone, change password, delete account
10. Toast notifications, validation, loading/empty/error states
11. Fully responsive (mobile, tablet, desktop)
12. Deployment (Vercel + Render/Railway + MongoDB Atlas), README, demo data seeder

### 3.2 Phase 2 (Bonus — build after MVP is stable and deployed)
- Export transactions to CSV and PDF
- Recurring transactions (daily/weekly/monthly) via scheduled job
- Light/Dark mode toggle (persisted)
- PWA (installable, offline shell)
- Monthly email report via Nodemailer (needs SMTP credentials)
- Forgot/reset password via email (needs SMTP credentials)

### 3.3 Out of Scope
Bank account syncing, payment processing, multi-user/shared budgets, investments, multi-currency conversion, native mobile apps, admin panel. (**No payment gateway is required.**)

## 4. Functional Requirements
Priority: **M** = Must (MVP), **S** = Should (MVP if time), **B** = Bonus (Phase 2).

### 4.1 Authentication & Account (FR-AUTH)
| ID | Requirement | Pri |
|---|---|---|
| FR-AUTH-01 | Register with name, email, password (min 8 chars, ≥1 letter and ≥1 number); email unique, case-insensitive | M |
| FR-AUTH-02 | Login with email + password; on success receive access token (JSON) and refresh token (httpOnly cookie) | M |
| FR-AUTH-03 | Passwords hashed with bcrypt (cost ≥ 12); never returned by any endpoint | M |
| FR-AUTH-04 | Silent session restore on page reload via refresh endpoint | M |
| FR-AUTH-05 | Logout revokes refresh token server-side and clears client state | M |
| FR-AUTH-06 | Protected routes redirect unauthenticated users to /login (and back after login) | M |
| FR-AUTH-07 | Generic error on bad credentials ("Invalid email or password") — no user enumeration | M |
| FR-AUTH-08 | Update profile (name, currency, timezone) | M |
| FR-AUTH-09 | Change password (requires current password; revokes other sessions) | S |
| FR-AUTH-10 | Delete account and all owned data (requires password confirmation) | S |
| FR-AUTH-11 | Forgot/reset password by email link | B |
| FR-AUTH-12 | On registration, seed the user's default categories | M |

### 4.2 Transactions (FR-TXN)
| ID | Requirement | Pri |
|---|---|---|
| FR-TXN-01 | Create transaction: type (income/expense), amount (>0, ≤2 decimals), category, date, note (≤500), payment method (optional) | M |
| FR-TXN-02 | List own transactions with pagination (default 20, max 100), sort (date/amount), newest first by default | M |
| FR-TXN-03 | Filter by date range, type, category (multi), text search in note, min/max amount | M |
| FR-TXN-04 | Edit transaction | M |
| FR-TXN-05 | Delete transaction with confirmation dialog; optimistic UI update with rollback on failure | M |
| FR-TXN-06 | Category must match transaction type and belong to the user | M |
| FR-TXN-07 | A user can never read/modify another user's transactions (return 404, not 403) | M |
| FR-TXN-08 | Add/edit form available as modal (desktop) / full-screen sheet (mobile), plus a floating "+" button | M |
| FR-TXN-09 | Export filtered transactions as CSV | B |
| FR-TXN-10 | Export as PDF | B |
| FR-TXN-11 | Recurring transaction rules | B |

### 4.3 Categories (FR-CAT)
| ID | Requirement | Pri |
|---|---|---|
| FR-CAT-01 | Default categories seeded per user (see doc 04 §3.2) | M |
| FR-CAT-02 | Create/edit/delete custom categories (name, type, color, icon) | M |
| FR-CAT-03 | Deleting a category in use requires reassigning its transactions to another category of same type | M |
| FR-CAT-04 | Category names unique per user per type (case-insensitive) | M |

### 4.4 Analytics & Charts (FR-VIS)
| ID | Requirement | Pri |
|---|---|---|
| FR-VIS-01 | Summary: total income, total expense, balance, transaction count for a selected period (this month default; presets: This month, Last month, Last 3 months, This year, Custom) | M |
| FR-VIS-02 | Pie/donut chart: expense by category with legend, percentages, tooltip | M |
| FR-VIS-03 | Bar chart: income vs expense for each of the last 6 (or selected 12) months | M |
| FR-VIS-04 | Line chart: daily spending/balance trend within selected period | S |
| FR-VIS-05 | Charts update live after add/edit/delete without full page reload | M |
| FR-VIS-06 | Charts respect active filters/period | M |
| FR-VIS-07 | Charts have accessible text alternative (data table toggle or aria-label summary) | S |

### 4.5 Budgets (FR-BUD)
| ID | Requirement | Pri |
|---|---|---|
| FR-BUD-01 | Set an overall monthly budget and/or per-category monthly limits (expense categories only) | M |
| FR-BUD-02 | View budget progress for a month: spent, limit, remaining, percent, status (ok <80%, warning 80–100%, exceeded >100%) | M |
| FR-BUD-03 | Visual progress bars with color status; warning toast/banner when a newly added expense crosses 80% or 100% | M |
| FR-BUD-04 | Edit/delete a budget; "copy last month's budgets" action | S |
| FR-BUD-05 | Budget history: navigate to previous months | S |

### 4.6 Dashboard & UX (FR-UX)
| ID | Requirement | Pri |
|---|---|---|
| FR-UX-01 | Dashboard greeting with username and time-appropriate salutation | M |
| FR-UX-02 | Dashboard contains: summary cards, pie chart, bar chart, budget snapshot (top 3 by usage), 5 most recent transactions | M |
| FR-UX-03 | Toasts for every create/update/delete/error (react-hot-toast) | M |
| FR-UX-04 | Skeleton loaders for data regions; spinners on buttons during submit | M |
| FR-UX-05 | Empty states with a call-to-action on every list/chart | M |
| FR-UX-06 | Global error boundary and friendly 404 page | M |
| FR-UX-07 | Light/Dark mode | B |
| FR-UX-08 | PWA install support | B |

### 4.7 Demo & Developer Experience (FR-DEV)
| ID | Requirement | Pri |
|---|---|---|
| FR-DEV-01 | `npm run seed` creates a demo user (demo@fintrack.app / Demo@1234) with ~6 months of realistic data | M |
| FR-DEV-02 | README with features, stack, screenshots placeholders, setup, env vars, deploy steps, live demo link | M |
| FR-DEV-03 | `.env.example` in both client and server | M |
| FR-DEV-04 | ESLint + Prettier configured in both packages | M |

## 5. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Performance | Dashboard first meaningful paint < 2.5 s on 4G; API p95 < 400 ms for list/stat endpoints (indexed); frontend bundle code-split per route |
| Security | See doc 06 §1 (OWASP Top 10 aligned) |
| Responsiveness | Works at 360 px → 1920 px; touch targets ≥ 44 px |
| Accessibility | WCAG 2.1 AA target: keyboard navigable, labels on inputs, color contrast ≥ 4.5:1, focus rings, aria-live toasts |
| Browser support | Latest 2 versions of Chrome, Edge, Firefox, Safari; iOS Safari, Android Chrome |
| Reliability | Graceful handling of API failures (retry/CTA), no unhandled promise rejections, health endpoint |
| Maintainability | Layered backend, reusable components, no files > ~300 lines, JSDoc for non-obvious functions |
| Data integrity | Money stored as integer minor units; all writes validated server-side |
| Scalability | Indexed queries, pagination everywhere, stateless API (horizontally scalable) |

## 6. Use Cases → Requirements Traceability
| # | Use Case | Requirements |
|---|---|---|
| 1 | Registration & Login | FR-AUTH-01..07, 12 |
| 2 | Add Income/Expense | FR-TXN-01, 06, 08; FR-UX-03 |
| 3 | View Charts & Summary | FR-VIS-01..07 |
| 4 | Delete a Transaction | FR-TXN-05 |
| 5 | Filter by Category/Date | FR-TXN-03; FR-VIS-06 |
| 6 | Transaction History | FR-TXN-02, 03 |
| 7 | Responsive Dashboard | NFR Responsiveness; Day-12 work |
| 8 | Logout & Secure Routes | FR-AUTH-05, 06 |
| 9 | Export (Bonus) | FR-TXN-09, 10 |
| 10 | Budgets (added) | FR-BUD-01..05 |

## 7. Acceptance Criteria (Key Flows)
**AC-1 Register/Login:** Given a new visitor, when they submit valid details, then an account exists, default categories are seeded, they land on /dashboard, and a reload keeps them logged in.
**AC-2 Add expense:** Given a logged-in user, when they submit a valid expense, then it appears at top of Recent Transactions, summary cards and charts update without reload, a success toast shows, and a budget warning shows if a threshold is crossed.
**AC-3 Isolation:** Given users A and B, when A requests B's transaction id, then the API returns 404.
**AC-4 Filter:** Given 50+ transactions, when the user filters by category + date range, then list, totals, and charts reflect only matching data.
**AC-5 Delete:** Given a transaction, when the user confirms deletion, then it disappears instantly; if the API fails it reappears with an error toast.
**AC-6 Mobile:** At 375 px width, no horizontal scroll, navigation via bottom tab bar, charts are readable and touch-interactive.
**AC-7 Logout:** After logout, protected routes redirect to /login and the refresh cookie is invalid.

## 8. Assumptions & Decisions (agent must follow unless owner overrides)
| ID | Decision | Rationale |
|---|---|---|
| D-01 | Vite + React 18 (not CRA), JavaScript with JSDoc (TypeScript optional if owner requests) | CRA is deprecated; JS keeps beginner-friendly |
| D-02 | Access token (15 min) kept in memory; refresh token (7 days, rotating) in httpOnly Secure cookie | Safer than localStorage against XSS |
| D-03 | Custom JWT auth (not Clerk/Auth0) | Demonstrates auth skills; no third-party account needed |
| D-04 | Context API + useReducer for auth/UI state; TanStack Query not required — use custom hooks with Axios | Matches the original plan; Redux is not needed |
| D-05 | Recharts for charts | Native React, simple API |
| D-06 | Money stored as integer minor units (e.g., cents) | Avoids floating-point errors |
| D-07 | Default currency USD, user-changeable (INR, EUR, GBP, etc.) via Intl.NumberFormat | Owner can set a different default (see doc 07) |
| D-08 | Dates use native Intl/date-fns (not moment.js — deprecated) | Smaller bundle, maintained |
| D-09 | Express 4.x, Node 20 LTS+, Mongoose 8 | Stability |
| D-10 | No payments, no file uploads in MVP | Not needed by the idea |

## 9. Success Metrics
- All MVP "M" requirements pass acceptance criteria
- Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90
- Backend test coverage ≥ 70% on services/controllers; critical flows tested
- Live deployed URL working with demo account
- Zero secrets in repository

## 10. Glossary
**Minor units:** smallest currency unit (cents/paise). **Access token:** short-lived JWT sent in `Authorization: Bearer`. **Refresh token:** long-lived opaque/JWT token in httpOnly cookie used to get new access tokens. **Period:** the date range applied to summaries/charts.
