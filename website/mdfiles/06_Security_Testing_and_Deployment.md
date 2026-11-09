# 06 — Security, Testing & Deployment Guide
**Project:** FinTrack | **Depends on:** 01–05

---

## 1. Security Checklist (all must be ✅ before deployment)
### 1.1 Authentication & Sessions
- [ ] Passwords hashed with bcrypt cost ≥ 12; never logged or returned
- [ ] Access JWT: 15 min, signed HS256 with ≥ 32-char secret from env; verify `exp`, reject `alg:none`
- [ ] Refresh token: random 64 bytes, only SHA-256 hash stored, rotated on every use, reuse detection revokes all sessions
- [ ] Refresh cookie: `httpOnly`, `secure` (prod), correct `sameSite`, scoped `path`, 7-day expiry
- [ ] Generic login error; rate limit on auth routes (10 / 15 min / IP); optional lockout delay after repeated failures
- [ ] Logout revokes server-side token; password change revokes other sessions
### 1.2 Authorization & Data Access
- [ ] Every query on user data filtered by `req.user.id`; foreign ids → 404
- [ ] `user` field never accepted from request body
- [ ] Category/transaction type consistency enforced server-side
### 1.3 Input & Output
- [ ] zod validation on every body, query, and param; unknown fields rejected
- [ ] `express-mongo-sanitize` and `hpp` enabled; regex search input escaped
- [ ] Body size limit (10 kb); pagination `limit` capped at 100
- [ ] No `dangerouslySetInnerHTML`; user text only rendered via React escaping
- [ ] CSV export neutralizes formula injection (prefix cells starting with `= + - @` with `'`)
### 1.4 Transport & Headers
- [ ] HTTPS only in production; `helmet` enabled (CSP configured for API; client CSP via Vercel headers optional)
- [ ] CORS allow-list = exact `CLIENT_URL` (no `*` with credentials)
- [ ] `x-powered-by` disabled
### 1.5 Secrets & Config
- [ ] `.env` git-ignored; `.env.example` has placeholders only; env validated at boot
- [ ] Different secrets for dev vs prod; Atlas user has least privilege (readWrite on one DB)
- [ ] `npm audit` run; no high/critical vulnerabilities unresolved
### 1.6 Errors & Logging
- [ ] No stack traces or internal messages in production responses
- [ ] Logs exclude passwords, tokens, and full request bodies of auth routes

## 2. Testing Strategy
### 2.1 Backend (Jest + Supertest + mongodb-memory-server)
| Area | Must-have tests |
|---|---|
| Auth | register (valid/duplicate/weak password), login (ok/bad), refresh rotation, reuse detection, logout, `/me` unauthorized |
| Categories | seed on register, create/duplicate, delete in-use → 409, delete with reassign |
| Transactions | create valid, invalid amount/date, category-type mismatch (422), list pagination/filter/sort/search, update, delete, **cross-user isolation (404)** |
| Stats | summary totals, by-category percentages, monthly zero-fill, timezone boundary (e.g., transaction at 23:30 local on last day of month) |
| Budgets | upsert/unique, progress math, status thresholds (79/80/100/101 %), alerts on expense create, copy month |
| Misc | health, 404 handler, rate-limit 429, validation error shape |
Target coverage: ≥ 70 % overall, ≥ 85 % on services.
### 2.2 Frontend (Vitest + React Testing Library)
Auth forms (validation, error mapping), ProtectedRoute redirect, TransactionForm (type toggles category list, validation, submit), TransactionFilters (URL sync), SummaryCards rendering/formatting, BudgetCard status colors, formatCurrency/formatDate utils, optimistic delete rollback.
### 2.3 Manual QA Script (agent runs and reports results)
1. Register → default categories visible → add 3 expenses + 1 income → cards/charts update.
2. Filter by category + dates → list, totals, charts agree.
3. Edit and delete (including simulated API failure → rollback).
4. Set budget → add expense crossing 80 % and 100 % → toasts appear.
5. Reload page → session persists; logout → protected URL redirects.
6. Second account cannot see first account's data.
7. Resize 360 → 1920 px; test keyboard-only navigation; check console is clean.
8. Run Lighthouse (mobile) on /dashboard and /.
### 2.4 Optional E2E
Playwright smoke flow (register → add transaction → see on dashboard) — recommended, not mandatory.

## 3. Deployment Procedure
### 3.1 MongoDB Atlas (owner creates account; agent gives exact clicks)
1. Create free **M0** cluster (closest region to Render region).
2. Database Access → add user (username + strong generated password, role `readWrite` on the app DB).
3. Network Access → allow `0.0.0.0/0` (free-tier hosting has dynamic IPs; rely on strong credentials) or the host's static IPs.
4. Connect → Drivers → copy the connection string; replace `<password>`; append DB name (e.g., `fintrack`). Provide as `MONGODB_URI`.
### 3.2 Backend on Render (or Railway)
1. Push repo to GitHub. Render → New → Web Service → connect repo.
2. Root Directory `server`; Build `npm install`; Start `npm start`; Health Check Path `/api/v1/health`; Node 20.
3. Environment variables: `NODE_ENV=production`, `PORT` (Render sets), `MONGODB_URI`, `JWT_ACCESS_SECRET` (new, 48+ random bytes), `JWT_ACCESS_EXPIRES_IN=15m`, `REFRESH_TOKEN_TTL_DAYS=7`, `CLIENT_URL=https://<vercel-domain>`, `COOKIE_SECURE=true`, `BCRYPT_COST=12`.
4. Deploy; open `https://<service>.onrender.com/api/v1/health` → expect `ok` and `db: connected`.
5. Seed demo data once (Render Shell or locally pointing at prod URI with `--force`): `npm run seed -- --force`.
(Railway equivalent: New Project → Deploy from GitHub → set root `server`, same variables.)
### 3.3 Frontend on Vercel
1. Vercel → Add New Project → import repo; Framework Preset Vite; Root Directory `client`.
2. Env var `VITE_API_URL=https://<service>.onrender.com/api/v1`.
3. Ensure `client/vercel.json` SPA rewrite exists. Deploy.
4. Copy the Vercel URL into Render's `CLIENT_URL`; redeploy backend.
### 3.4 Cross-Site Cookie Verification (critical)
Because Vercel and Render are different sites, browsers may restrict third-party cookies. Verify in Chrome, Firefox, and Safari (desktop + iOS): login → reload → still logged in.
- **If it works everywhere:** done.
- **If blocked (common on Safari):** choose the recommended fix and tell the owner: **Vercel rewrite proxy** — in `client/vercel.json` add `{ "source": "/api/:path*", "destination": "https://<service>.onrender.com/api/:path*" }` before the SPA rewrite, set `VITE_API_URL=/api/v1`, and cookie `sameSite: 'lax'`. This makes cookies first-party with no custom domain. (Alternative: custom domain with `app.` and `api.` subdomains.)
### 3.5 Custom Domain (optional)
Owner buys/uses a domain; add to Vercel (Settings → Domains), configure DNS records Vercel shows; update `CLIENT_URL`; for API subdomain add custom domain in Render. See doc 07 for what to provide.
### 3.6 CI/CD
Auto-deploy on push to `main` (both hosts). Optional GitHub Action running lint + tests on PRs.

## 4. Post-Deployment Smoke Tests
- [ ] `/api/v1/health` ok
- [ ] Register new user on live site; categories present
- [ ] Add/edit/delete transaction; charts update
- [ ] Reload page; session persists; logout works
- [ ] Budget warning toast fires
- [ ] Mobile device check (real phone or emulator)
- [ ] No CORS/cookie errors in console
- [ ] Demo login works
- [ ] First-request cold-start state displays gracefully

## 5. README Outline (agent writes in Phase 9, finalizes in Phase 10)
Title + badges · One-paragraph description · Live demo + demo credentials · Screenshots (placeholders → owner replaces) · Features · Tech stack · Architecture diagram · Folder structure · Getting started (prereqs, clone, env, install, seed, run) · Environment variables table · API overview (link to doc 04 summary) · Testing · Deployment steps · Security notes · Roadmap/Bonus · License (MIT unless owner states otherwise) · Author/contact (owner provides).

## 6. Maintenance Notes
Rotate JWT secret by deploying a new value (forces re-login). Monitor Atlas storage (512 MB free). Keep dependencies updated monthly (`npm outdated`).
