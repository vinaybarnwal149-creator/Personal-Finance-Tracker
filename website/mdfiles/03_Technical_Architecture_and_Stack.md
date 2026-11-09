# 03 — Technical Architecture & Technology Stack
**Project:** FinTrack | **Depends on:** 01 PRD, 02 UI/UX

---

## 1. Technology Stack
| Layer | Technology | Version guidance | Purpose |
|---|---|---|---|
| Runtime | Node.js | 20 LTS or newer | Server + tooling |
| Frontend | React + Vite | React 18, Vite 5+ | SPA |
| Styling | Tailwind CSS | v3.4.x (+ `@tailwindcss/forms`) | Utility styling, responsive |
| Routing | react-router-dom | v6 | Client routing, protected routes |
| State | Context API + `useReducer` | — | Auth, UI/theme, toasts config |
| Server data | Axios + custom hooks (`useTransactions`, `useStats`, …) | axios 1.x | API calls, interceptors |
| Forms | react-hook-form + zod + @hookform/resolvers | latest | Validation |
| Charts | Recharts | 2.x | Pie/Bar/Line |
| Toasts | react-hot-toast | 2.x | Feedback |
| Icons | lucide-react | latest | Icon set |
| Dates | date-fns + Intl API | 3.x | Formatting (no moment.js) |
| Backend | Express.js | 4.x | REST API |
| DB | MongoDB Atlas + Mongoose | Mongoose 8 | Persistence |
| Auth | jsonwebtoken + bcryptjs + cookie-parser | latest | JWT access + refresh |
| Validation (server) | zod | latest | Request schemas |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize, hpp | latest | Hardening |
| Logging | pino + pino-http (or morgan in dev) | latest | Structured logs |
| Tooling | ESLint, Prettier, nodemon, dotenv | latest | DX |
| Testing | Vitest + React Testing Library (client); Jest + Supertest + mongodb-memory-server (server) | latest | Tests |
| Bonus libs | json2csv / fast-csv, pdfkit or jsPDF, node-cron, nodemailer, vite-plugin-pwa | latest | Phase 2 |
| Deploy | Vercel (client), Render or Railway (server), MongoDB Atlas (DB) | free tiers | Hosting |
| VCS | Git + GitHub | — | Source control, CI deploy hooks |

**Language:** JavaScript (ES modules on both sides). Use JSDoc typedefs for core entities. (Switching to TypeScript requires owner approval.)

## 2. High-Level Architecture
```
┌────────────────────────┐   HTTPS (JSON, cookies)   ┌──────────────────────────┐        ┌──────────────┐
│  React SPA (Vercel)    │ ───────────────────────▶ │  Express API (Render)    │ ─────▶ │ MongoDB Atlas│
│  Router · Context ·    │ ◀─────────────────────── │  routes→controllers→     │ ◀───── │ users, txns, │
│  Axios · Recharts      │   access JWT / refresh    │  services→models         │        │ cats, budgets│
└────────────────────────┘   cookie (httpOnly)       └──────────────────────────┘        └──────────────┘
```
Stateless API; all authorization derived from the verified JWT (`req.user.id`).

## 3. Repository Structure (monorepo, two packages)
```
fintrack/
├── README.md
├── PROGRESS.md                  # agent-maintained checklist (see doc 05)
├── docs/                        # the 7 project documents
├── .gitignore
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example             # VITE_API_URL=
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # providers + router
│       ├── routes/              # AppRoutes.jsx, ProtectedRoute.jsx, GuestRoute.jsx
│       ├── api/                 # axiosInstance.js, authApi.js, transactionsApi.js, categoriesApi.js, budgetsApi.js, statsApi.js, usersApi.js
│       ├── context/             # AuthContext.jsx, ThemeContext.jsx
│       ├── hooks/               # useAuth, useTransactions, useCategories, useBudgets, useStats, useDebounce, useMediaQuery
│       ├── components/
│       │   ├── ui/  layout/  charts/  features/
│       ├── pages/               # Landing, Login, Register, Dashboard, Transactions, Budgets, Reports, Settings, NotFound
│       ├── utils/               # formatCurrency.js, formatDate.js, periods.js, constants.js, errors.js
│       ├── schemas/             # zod schemas (auth, transaction, budget, category)
│       └── styles/index.css     # Tailwind directives
└── server/
    ├── package.json
    ├── .env.example
    └── src/
        ├── server.js            # bootstrap: connect DB, listen
        ├── app.js               # express app, middleware, routes
        ├── config/              # env.js (validated with zod), db.js, cors.js
        ├── models/              # User.js, RefreshToken.js, Category.js, Transaction.js, Budget.js, RecurringRule.js (bonus)
        ├── routes/              # index.js, auth.routes.js, users.routes.js, categories.routes.js, transactions.routes.js, budgets.routes.js, stats.routes.js
        ├── controllers/         # thin: parse req → call service → send res
        ├── services/            # business logic + DB access
        ├── validators/          # zod schemas per route
        ├── middleware/          # auth.js, validate.js, errorHandler.js, notFound.js, rateLimiters.js
        ├── utils/               # ApiError.js, asyncHandler.js, money.js, tokens.js, logger.js
        ├── seeds/               # defaultCategories.js, demoData.js, seed.js
        └── jobs/                # recurring.job.js (bonus)
    └── tests/                   # auth.test.js, transactions.test.js, budgets.test.js, stats.test.js, helpers/
```

## 4. Backend Architecture
### 4.1 Layering (strict)
`routes` (URL + middleware chain) → `controllers` (HTTP only) → `services` (business rules, DB queries) → `models` (Mongoose). Controllers never touch models directly; services never touch `req`/`res`.
### 4.2 Middleware order in `app.js`
`helmet` → `cors` (allow-list, `credentials:true`) → `express.json({limit:'10kb'})` → `cookie-parser` → `express-mongo-sanitize` → `hpp` → request logger → global rate limiter → `/api/v1/health` → routers → `notFound` → `errorHandler`.
### 4.3 Error handling
Custom `ApiError(status, code, message, details)`. `asyncHandler` wraps async controllers. Central `errorHandler` maps: ZodError → 400 `VALIDATION_ERROR`; Mongoose duplicate key → 409 `DUPLICATE`; CastError → 400 `INVALID_ID`; JWT errors → 401; unknown → 500 `INTERNAL_ERROR` (no stack trace in production). Standard response envelope defined in doc 04 §1.
### 4.4 Authentication flow
1. **Register/Login:** verify credentials → create **access token** (JWT, 15 min, payload `{sub: userId}`) and **refresh token** (random 64-byte value; only its SHA-256 hash stored in `RefreshToken` collection with `expiresAt`, `userAgent`, `ip`). Refresh token sent as cookie `refreshToken` (`httpOnly`, `secure` in prod, `sameSite: 'none'` in prod / `'lax'` in dev, `path: '/api/v1/auth'`, 7 days). Access token returned in JSON body.
2. **Request:** client sends `Authorization: Bearer <access>`; `auth` middleware verifies and attaches `req.user = {id}`.
3. **Refresh:** `POST /auth/refresh` reads the cookie, validates hash & expiry, **rotates** (revoke old, issue new refresh + new access). Reuse of a revoked token revokes all of that user's tokens (theft detection).
4. **Logout:** revoke current refresh token, clear cookie.
5. **Client:** access token lives in AuthContext memory. Axios request interceptor attaches it; response interceptor on 401 (once, non-auth routes) calls `/auth/refresh`, retries the original request, queues concurrent requests during refresh; on failure → logout + redirect. On app start, `AuthContext` calls `/auth/refresh` then `/auth/me` to restore session.
### 4.5 Authorization
Every query on user-owned data includes `{ user: req.user.id }`. Non-owned ids → 404.
### 4.6 Stats via aggregation
Summary, category breakdown, monthly trend, daily trend use MongoDB aggregation pipelines with `$match` on `user` + date range, `$group`, and `$dateToString` with the user's timezone (see doc 04 §6).
### 4.7 Config
`config/env.js` validates env vars with zod at boot; the process exits with a clear message if any required var is missing.

## 5. Frontend Architecture
- **Providers (App.jsx):** `AuthProvider` → `ThemeProvider` → `BrowserRouter` → `Toaster` → routes. `ErrorBoundary` wraps the router.
- **Routing:** `React.lazy` + `Suspense` per page for code splitting. `ProtectedRoute` waits for auth bootstrap (`isLoading`) before redirecting.
- **Data fetching:** each domain has an `api/*.js` module (plain functions returning data) and a hook that manages `{data, loading, error, refetch}`. Mutations expose optimistic helpers. To keep dashboard widgets in sync after mutations, use a lightweight **`DataRefreshContext`** (a version counter that hooks depend on) or an event emitter — transaction mutations bump the counter so stats/charts/budgets refetch. (Agent may choose TanStack Query instead if it explains the benefit and the owner agrees — default is Context + hooks per D-04.)
- **Forms:** react-hook-form + zod schemas in `src/schemas`; server validation errors mapped via `setError`.
- **Styling:** Tailwind utilities; shared patterns extracted into components (not `@apply` sprawl). Tokens from doc 02.
- **Formatting utils:** single source of truth for currency/date formatting; all components use them.
- **Environment:** `VITE_API_URL` (e.g., `http://localhost:5000/api/v1`).

## 6. Environment Variables
### 6.1 `server/.env.example`
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<min 32 random chars>
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=7
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
BCRYPT_COST=12
# Bonus
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```
### 6.2 `client/.env.example`
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=FinTrack
```
Real `.env` files are git-ignored. Secrets are generated with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## 7. Scripts
**server:** `dev` (nodemon), `start`, `seed`, `seed:reset`, `test`, `lint`, `format`.
**client:** `dev`, `build`, `preview`, `test`, `lint`, `format`.
**root (optional):** `npm run dev` runs both with `concurrently`.

## 8. Coding Standards
- ES modules, `async/await`, no callbacks. `const` by default. Named exports for utils, default exports for React components/pages.
- Functions < 50 lines; files < ~300 lines; one component per file; PascalCase components, camelCase functions, kebab/dot-case route/service files as shown.
- No magic strings: constants in `utils/constants.js` (e.g., `TRANSACTION_TYPES`, `PAYMENT_METHODS`).
- No `console.log` in committed code (use logger). No commented-out code. No hard-coded URLs/secrets.
- Comments explain **why**, JSDoc for exported functions.
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Every endpoint: validated input, auth check, consistent response envelope, tests.

## 9. Deployment Architecture
- **Client → Vercel:** root dir `client`, build `npm run build`, output `dist`, env `VITE_API_URL`. Add `vercel.json` SPA rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- **Server → Render (or Railway):** root dir `server`, build `npm install`, start `npm start`, health check `/api/v1/health`, env vars per §6.1 with `NODE_ENV=production`, `COOKIE_SECURE=true`, `CLIENT_URL=<vercel url>`.
- **DB → MongoDB Atlas:** M0 free cluster, DB user with least privilege, IP access list (`0.0.0.0/0` acceptable for free-tier hosting with strong credentials, or hosting provider's static IPs if available).
- **Free-tier note:** Render free instances sleep after inactivity — first request can take ~30–60 s. UI must show a "Waking up server…" loading state when the first auth/refresh call exceeds 3 s.
- **Cross-site cookies:** because client and API are on different domains, production cookie must be `SameSite=None; Secure`; CORS must allow exact client origin with `credentials: true`; Axios uses `withCredentials: true`. (Using a custom domain with subdomains of the same site later removes third-party cookie risk — see doc 06 §3.4.)

## 10. Decision Log (agent must append here when it deviates or chooses between options)
| # | Date | Decision | Alternatives | Reason |
|---|---|---|---|---|
| 1 | — | Custom JWT with refresh rotation | Clerk/Auth0 | No external account, shows skill |
| 2 | — | Recharts | Chart.js | React-native API |
| 3 | — | Integer minor units for money | Float | Precision |
