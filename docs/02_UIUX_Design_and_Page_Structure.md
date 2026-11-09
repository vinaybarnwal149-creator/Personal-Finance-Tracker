# 02 — UI/UX Design & Page Structure
**Project:** FinTrack | **Depends on:** 01 PRD

---

## 1. Design Principles
1. **Clarity first** — money data must be instantly readable (large numerals, clear income/expense colors).
2. **Fast entry** — adding a transaction takes ≤ 3 taps/clicks from anywhere.
3. **Mobile-first** — design at 375 px, enhance with `md:` (768) and `lg:` (1024) breakpoints.
4. **Consistent feedback** — every action produces a toast, loader, or state change.
5. **Calm and trustworthy** — clean whitespace, soft shadows, no visual clutter.

## 2. Design Tokens
### 2.1 Colors (define in `tailwind.config.js` under `theme.extend.colors` and as CSS variables for dark mode)
| Token | Light | Dark (bonus) | Usage |
|---|---|---|---|
| `primary` | `#4F46E5` (indigo-600) | `#818CF8` | Buttons, links, active nav |
| `primary-hover` | `#4338CA` | `#6366F1` | Hover |
| `income` | `#10B981` (emerald-500) | `#34D399` | Income amounts, charts |
| `expense` | `#F43F5E` (rose-500) | `#FB7185` | Expense amounts, charts |
| `warning` | `#F59E0B` | `#FBBF24` | Budget 80–100% |
| `bg` | `#F8FAFC` | `#0F172A` | App background |
| `surface` | `#FFFFFF` | `#1E293B` | Cards |
| `border` | `#E2E8F0` | `#334155` | Dividers |
| `text` | `#0F172A` | `#F1F5F9` | Primary text |
| `muted` | `#64748B` | `#94A3B8` | Secondary text |
**Category chart palette (12):** `#6366F1 #10B981 #F59E0B #F43F5E #06B6D4 #8B5CF6 #EC4899 #84CC16 #F97316 #14B8A6 #A855F7 #64748B`.
> If the owner supplies brand colors (doc 07), replace `primary` and keep the rest.

### 2.2 Typography
Font: **Inter** (Google Fonts, `font-display: swap`), fallback `system-ui, sans-serif`.
| Style | Size/Weight |
|---|---|
| Page title | `text-2xl md:text-3xl font-bold` |
| Section title | `text-lg font-semibold` |
| Card figure | `text-2xl md:text-3xl font-bold tabular-nums` |
| Body | `text-sm md:text-base` |
| Caption | `text-xs text-muted` |
Always use `tabular-nums` for money.

### 2.3 Spacing, Shape, Elevation
Cards: `rounded-2xl border bg-surface shadow-sm p-4 md:p-6`. Inputs/buttons: `rounded-xl`, height `h-11`. Page padding `px-4 md:px-6 lg:px-8`, max content width `max-w-7xl mx-auto`. Spacing scale: 4/8/12/16/24/32 px.

## 3. Sitemap & Routes
| Route | Page | Access | Layout |
|---|---|---|---|
| `/` | Landing | Public (redirect to /dashboard if logged in) | PublicLayout |
| `/register` | Sign up | Guest only | AuthLayout |
| `/login` | Log in | Guest only | AuthLayout |
| `/forgot-password`, `/reset-password/:token` | Reset flow | Guest (Bonus) | AuthLayout |
| `/dashboard` | Dashboard | Protected | AppLayout |
| `/transactions` | Transactions list | Protected | AppLayout |
| `/budgets` | Budgets | Protected | AppLayout |
| `/reports` | Analytics (full charts + period selector) | Protected | AppLayout |
| `/settings` | Profile, Categories, Security, Danger zone | Protected | AppLayout |
| `*` | 404 | Public | PublicLayout |
Add/Edit transaction is a **modal/sheet**, not a route (also reachable via `?new=1` query for deep link).

## 4. Global Layout
### 4.1 AppLayout
- **Desktop (≥1024):** fixed left sidebar (240 px): logo, nav (Dashboard, Transactions, Budgets, Reports, Settings), user chip + Logout at bottom. Top bar: page title, period selector (where relevant), "+ Add Transaction" primary button, theme toggle (bonus).
- **Tablet (768–1023):** collapsible sidebar (icon-only, expand on hover/click).
- **Mobile (<768):** top bar (logo + avatar menu), **bottom tab bar** (Dashboard, Transactions, [+ center FAB], Budgets, Settings), content scrolls between.
### 4.2 PublicLayout / AuthLayout
Landing: sticky header (logo, Login, Get Started). Auth: centered card (max-w-md) on gradient background, brand at top; on desktop optional split-screen with illustration/benefits panel.

## 5. Page Specifications

### 5.1 Landing (`/`)
Sections in order: **Hero** (headline, subheadline, CTA "Get Started Free" → /register, secondary "View Demo" → auto-fills demo login or /login, dashboard preview image) → **Features grid** (6 cards: Track, Categorize, Charts, Budgets, Secure, Responsive) → **How it works** (3 steps) → **Screenshot/preview** → **FAQ** (4 items) → **Final CTA** → **Footer** (links, © year).
> Copy: use placeholder copy in doc 07 §Copy unless the owner provides text.

### 5.2 Register (`/register`)
Fields: Name, Email, Password (show/hide toggle + strength meter), Confirm Password. Button "Create account". Link to login. Inline validation on blur; server errors map to fields (e.g., email taken). Success → toast "Welcome, {name}!" → /dashboard.
### 5.3 Login (`/login`)
Fields: Email, Password (show/hide), "Remember me" is not needed (refresh cookie handles it). Button "Log in". Links: Register, Forgot password (bonus). "Use demo account" button fills demo credentials. Redirect to originally requested route.

### 5.4 Dashboard (`/dashboard`)
Order (mobile stacks; desktop grid 12 cols):
1. **Header:** "Good morning/afternoon/evening, {firstName} 👋" + period selector (default This month).
2. **Summary cards (3–4):** Total Income (green), Total Expenses (red), Balance (indigo; red if negative), optional Savings Rate %. Each shows change vs previous period (▲/▼ %). Grid `grid-cols-1 sm:grid-cols-3`.
3. **Charts row:** Donut "Spending by Category" (col-span-5) + Bar "Income vs Expenses – last 6 months" (col-span-7).
4. **Lower row:** "Budget Snapshot" (top 3 budgets, progress bars, link to /budgets; col-span-5) + "Recent Transactions" (5 rows, "View all" link; col-span-7).
States: skeletons while loading; empty state ("No transactions yet — add your first one") with CTA.

### 5.5 Transactions (`/transactions`)
- **Toolbar:** search input (debounced 300 ms), type segmented control (All / Income / Expense), category multi-select, date range picker (presets + custom), amount min/max (in a "More filters" popover), sort dropdown, "Clear filters" link, "Export CSV" (bonus).
- **Summary strip:** totals for current filter (Income, Expense, Net, Count).
- **List:** Desktop = table (Date, Category chip with color dot, Note, Payment method, Amount (+green/−red), Actions: Edit, Delete). Mobile = card list grouped by date headers ("Today", "Yesterday", "12 Mar 2025") with swipe-free action menu (⋯).
- **Pagination:** page numbers + page size (10/20/50) on desktop; "Load more" on mobile.
- **Delete:** confirmation modal ("Delete this transaction? This can't be undone.").
- URL query params mirror filters (shareable/restorable): `?type=expense&category=id1,id2&from=2025-01-01&to=2025-01-31&q=rent&page=1&sort=-date`.

### 5.6 Add/Edit Transaction (Modal / Sheet)
Fields in order: **Type toggle** (Expense default / Income) → **Amount** (numeric, inputMode decimal, currency symbol prefix, autofocus) → **Category** (select with color dots, filtered by type; "＋ New category" inline) → **Date** (default today, max = today + 0; future dates allowed only for bonus recurring) → **Payment method** (optional select) → **Note** (textarea, 500 char counter). Buttons: Cancel, Save (disabled + spinner while submitting). "Save & add another" checkbox on create. Validation messages below fields. Esc closes; focus trapped; returns focus on close.

### 5.7 Budgets (`/budgets`)
- **Month selector** (← Month YYYY →).
- **Overall budget card:** big progress bar (spent / limit), remaining, status chip.
- **Category budgets grid:** card per budgeted category — icon, name, spent/limit, progress bar (green <80%, amber 80–100%, red >100%), edit/delete menu.
- **Actions:** "＋ Set budget" (modal: category [or Overall], limit amount), "Copy last month's budgets".
- **Empty state:** illustration + "Set your first budget".

### 5.8 Reports (`/reports`)
Period selector + type filter. Cards: Donut by category (with table beside it listing amount and % ), Monthly Income vs Expense bar (12 months), Daily spending line chart, Top 5 expense categories list, Top 5 largest transactions. "Show as table" toggle for accessibility.

### 5.9 Settings (`/settings`) — tabs (stacked sections on mobile)
1. **Profile:** name, email (read-only), currency, timezone. Save.
2. **Categories:** two lists (Expense / Income); add, edit (name, color picker from palette, icon from preset set), delete (with reassign dialog showing count of affected transactions).
3. **Security:** change password (current, new, confirm).
4. **Appearance (bonus):** theme.
5. **Danger zone:** delete account (type password + confirm checkbox).

### 5.10 404 & Error Boundary
Friendly illustration, message, button "Go to dashboard".

## 6. Component Inventory (build as reusable, in `client/src/components`)
**ui/** Button (variants: primary, secondary, ghost, danger; loading prop), Input, PasswordInput, Select, MultiSelect, Textarea, DatePicker/DateRangePicker, Modal, ConfirmDialog, Dropdown/Menu, Tabs, Badge/Chip, ProgressBar, Skeleton, Spinner, EmptyState, Pagination, SegmentedControl, Tooltip, Toaster wrapper.
**layout/** AppLayout, Sidebar, TopBar, BottomTabBar, PublicLayout, AuthLayout, PageHeader, ProtectedRoute, GuestRoute.
**charts/** CategoryDonutChart, MonthlyBarChart, TrendLineChart, ChartCard (title, loading, empty, "view as table").
**features/** StatCard / SummaryCards, TransactionForm, TransactionModal, TransactionTable, TransactionCardList, TransactionFilters, RecentTransactions, BudgetCard, BudgetForm, BudgetSnapshot, CategoryManager, ProfileForm, PasswordForm, PeriodSelector.
Rule: components receive data via props/hooks; no direct axios calls inside presentational components.

## 7. UX Behavior Rules
- **Money formatting:** `Intl.NumberFormat(locale, {style:'currency', currency})`; expenses show `−`, incomes `+`. Large numbers on cards may use compact notation on mobile only.
- **Dates:** display via `Intl.DateTimeFormat` / date-fns (`dd MMM yyyy`); relative labels "Today/Yesterday" in grouped lists.
- **Toasts:** top-center on mobile, top-right on desktop; success 3 s, error 5 s; one toast per action.
- **Loading:** skeletons for cards/charts/lists; buttons show spinner and disable. No layout shift.
- **Optimistic UI:** delete and create update the list immediately and roll back on error.
- **Forms:** validate onBlur and onSubmit using react-hook-form + zod; first invalid field is focused.
- **Session expiry:** if refresh fails, show toast "Session expired" and redirect to /login.
- **Budget alerts:** after creating/editing an expense, if the category or overall budget crosses 80% → warning toast; ≥100% → error-styled toast.
- **Confirmations** for all destructive actions.

## 8. Responsive Rules
| Breakpoint | Behavior |
|---|---|
| <640 | Single column; bottom tab bar; table → card list; charts full-width with reduced height (220 px); legends below |
| 640–1023 | 2-column grids; icon sidebar |
| ≥1024 | Full sidebar; 12-col dashboard grid; table view; charts height 280–320 px |
Charts must use `ResponsiveContainer`. No horizontal page scroll at any width (wide tables scroll inside their container only if unavoidable).

## 9. Accessibility Checklist
Semantic landmarks (`header`, `nav`, `main`); visible focus ring (`focus-visible:ring-2`); every input has `<label>`; icons-only buttons have `aria-label`; modals use `role="dialog"`, `aria-modal`, focus trap; toasts `aria-live="polite"`; color is never the only indicator (also use +/− signs and labels); respects `prefers-reduced-motion`.

## 10. Microcopy (defaults)
- Empty transactions: "No transactions yet. Add your first income or expense to get started."
- Empty chart: "Not enough data to show a chart for this period."
- Delete confirm: "Delete this transaction? This action can't be undone."
- Budget warning: "Heads up! You've used {pct}% of your {category} budget."
- Budget exceeded: "You've exceeded your {category} budget by {amount}."
- Auth error: "Invalid email or password."
- Generic error: "Something went wrong. Please try again."

## 11. Wireframe Notes (if no Figma is provided)
The agent should treat sections 4–5 as the wireframe. If the owner supplies Figma/PNG screenshots, those override layout details here, while tokens/behavior still apply.
