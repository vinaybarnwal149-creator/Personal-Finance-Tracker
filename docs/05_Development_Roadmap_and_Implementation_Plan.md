# 05 — Development Roadmap & Implementation Plan
**Project:** FinTrack | **Depends on:** 01–04
This is the authoritative build order. The agent must work phase by phase, update `PROGRESS.md` after each task, and not start a phase until the previous phase's **Exit Gate** passes.

---

## 1. Agent Working Agreement
1. Read all docs in `/docs` fully before writing code. Produce a short **Understanding Summary** and **Plan** (phases, risks, questions) first.
2. Never invent requirements. If something is ambiguous, check the docs; if still unclear, choose the best option, record it in the Decision Log (doc 03 §10), and continue. **Ask the owner only when blocked** (missing credential/asset, or a decision that changes scope/cost).
3. When asking, use this format: **Need:** what · **Why:** reason · **Where to get it:** exact steps · **Meanwhile:** what the agent will do without it.
4. After every phase: run lint, tests, and a manual smoke test (start both servers, exercise the feature). Fix all errors before marking Done.
5. Keep `PROGRESS.md` current (template in §4). Commit after each task with Conventional Commits.
6. Never commit secrets. Never hard-code credentials. Never skip a "Must" requirement.
7. When multiple approaches exist, recommend one, state the reason in one or two sentences, and proceed (unless cost/scope changes).
8. At the end of each phase, give the owner a short report: done / tested / needs from owner / next phase.

## 2. Phase Plan (maps to the 14-day schedule)

### Phase 0 — Document Review & Planning (before Day 1)
**Tasks:** read docs; produce Understanding Summary; list assumptions; create `PROGRESS.md`; confirm owner inputs needed for Phase 1.
**Needs from owner:** confirmation or changes to defaults (app name, currency, brand colors) — see doc 07 §A. If the owner gives no answer, use defaults.
**Exit gate:** summary + plan delivered.

### Phase 1 — Project Setup & Wireframe (Day 1–2)
**Tasks**
1. Init git repo; create folder structure (doc 03 §3); `.gitignore`, root README skeleton, `docs/` copied in.
2. `client`: Vite + React; install Tailwind v3.4 + forms plugin, router, axios, react-hook-form, zod, recharts, react-hot-toast, lucide-react, date-fns. Configure Tailwind tokens (doc 02 §2), Inter font, base layout shell, ESLint + Prettier.
3. `server`: init Express app, env validation, db connection module, health endpoint, error handler, logger, ESLint + Prettier, nodemon.
4. Placeholder routes/pages for all routes in doc 02 §3; AppLayout/PublicLayout/AuthLayout skeletons with responsive nav.
5. Wireframe: treat doc 02 as wireframe; build static, mock-data versions of Dashboard layout (no API).
**Needs from owner:** `MONGODB_URI` (Atlas) — required to finish step 3 DB connection; GitHub repo URL (optional now).
**Exit gate:** `npm run dev` runs both; `/api/v1/health` returns ok with db connected; client shows layouts at 375/768/1280.

### Phase 2 — Authentication (Day 3–4)
**Tasks:** User + RefreshToken models; `tokens.js` util; register/login/refresh/logout/me endpoints; auth middleware; rate limiters; default category seeding on register; client AuthContext (bootstrap via refresh), axios instance with interceptors (single-flight refresh), ProtectedRoute/GuestRoute, Login & Register pages with validation, logout button; "waking up server" state; tests for auth service/routes.
**Needs from owner:** generated `JWT_ACCESS_SECRET` (agent can generate a local dev one; owner must set a different strong value in production).
**Exit gate:** register → dashboard; reload stays logged in; logout blocks protected routes; invalid creds show generic error; refresh rotation test passes; auth tests green.

### Phase 3 — Categories & Transaction APIs (Day 5–6)
**Tasks:** Category + Transaction models/indexes; services/controllers/routes/validators for categories & transactions (doc 04 §4.4–4.5); ownership enforcement; seed util for default categories; API tests (CRUD, validation, isolation, pagination, filters).
**Exit gate:** all endpoints pass tests incl. user-isolation (AC-3).

### Phase 4 — Transaction UI (Day 5–7)
**Tasks:** API modules + hooks; TransactionForm/Modal (create/edit); Transactions page with filters, URL-sync, table/card views, pagination, delete confirm with optimistic update; formatting utils; category manager in Settings (CRUD + reassign flow); toasts, skeletons, empty states.
**Exit gate:** AC-2, AC-4, AC-5 pass manually; component tests for TransactionForm and filters.

### Phase 5 — Stats API & Charts (Day 8–9)
**Tasks:** stats endpoints (doc 04 §4.6, §6); tests with fixed fixtures (including timezone boundary case); `CategoryDonutChart`, `MonthlyBarChart`, `TrendLineChart`, `ChartCard`; period selector; live refresh after mutations via refresh context; chart table toggle.
**Exit gate:** charts match list data for same filters; add/delete updates charts without reload.

### Phase 6 — Summary Cards, Budgets (Day 10)
**Tasks:** `SummaryCards` (period aware, change %); Budget model + endpoints (doc 04 §4.7) + tests; Budgets page (progress, month nav, copy last month); budget alerts returned on expense create/update and shown as toasts; BudgetSnapshot widget.
**Exit gate:** thresholds 80%/100% trigger correct alerts; progress equals sum of month's expenses.

### Phase 7 — Dashboard, Reports, Settings & UX Polish (Day 11)
**Tasks:** Dashboard composition (doc 02 §5.4) with greeting and recent transactions; Reports page; Settings (profile, password, delete account); error boundary, 404; skeleton/loading/empty states everywhere; a11y pass (doc 02 §9); landing page.
**Exit gate:** AC-1 through AC-5 and AC-7 pass; no console errors/warnings.

### Phase 8 — Responsive & Mobile Testing (Day 12)
**Tasks:** verify all pages at 360, 375, 414, 768, 1024, 1280, 1920; bottom tab bar, FAB; charts sizing; touch targets; fix overflow; Lighthouse mobile run.
**Exit gate:** AC-6 passes; Lighthouse targets (doc 01 §9) met or deviations noted.

### Phase 9 — Hardening, Testing, Seed & Docs (Day 13–14, part 1)
**Tasks:** security checklist (doc 06 §1); complete backend test coverage target; key frontend tests; `npm run seed`; refactor; remove dead code; README with features, stack, architecture diagram, screenshots placeholders, setup, env, API summary, deploy steps, demo credentials.
**Exit gate:** `npm test` green both sides; lint clean; security checklist all ✅.

### Phase 10 — Deployment (Day 13)
**Tasks:** follow doc 06 §3 exactly: Atlas production DB, Render service, Vercel project, env vars, CORS/cookie verification, post-deploy smoke tests (doc 06 §4), README live links.
**Needs from owner:** accounts + access (GitHub, Vercel, Render/Railway, Atlas); production secrets; optional custom domain.
**Exit gate:** live URL works end-to-end with demo account; cookies persist; no CORS errors.

### Phase 11 — Bonus Features (only after Phase 10 passes; one at a time, each with tests and a deploy)
Order: 1) CSV export, 2) Dark mode, 3) PDF export, 4) Recurring transactions (node-cron or Render cron), 5) PWA, 6) Email reports + forgot password (needs SMTP).
**Needs from owner:** SMTP credentials for item 6 (see doc 07).

## 3. Definition of Done (per feature)
- Meets the relevant FR IDs and acceptance criteria
- Server validation + auth + ownership check present
- Loading, empty, and error states implemented
- Responsive at all breakpoints; keyboard accessible
- Unit/integration tests added and passing; lint clean
- No console errors; no secrets; docs/README updated
- `PROGRESS.md` updated; commit made

## 4. `PROGRESS.md` Template (agent creates and maintains at repo root)
```markdown
# FinTrack — Progress Tracker
_Last updated: <date/time>_

## Current Phase: <n> — <name>
## Blocked / Waiting on Owner
- [ ] <item> — Why needed: <reason> — How to provide: <steps>

## Phase Status
| Phase | Status (⬜ Not started / 🟡 In progress / ✅ Done) | Notes |
|---|---|---|
| 0 Review & Planning | ⬜ | |
| 1 Setup | ⬜ | |
| 2 Authentication | ⬜ | |
| 3 Categories & Txn API | ⬜ | |
| 4 Transaction UI | ⬜ | |
| 5 Stats & Charts | ⬜ | |
| 6 Summary & Budgets | ⬜ | |
| 7 Dashboard/UX/Settings | ⬜ | |
| 8 Responsive & Mobile | ⬜ | |
| 9 Hardening/Tests/Docs | ⬜ | |
| 10 Deployment | ⬜ | |
| 11 Bonus | ⬜ | |

## Requirement Checklist (copy every FR ID from doc 01 and tick when verified)
- [ ] FR-AUTH-01 …

## Decisions Made
## Known Issues / Tech Debt
## Test Status (client: x passing / server: y passing)
```

## 5. Git & Branching
`main` always deployable. Feature branches `feat/<phase>-<name>`; merge after tests pass. Tag `v1.0.0` after Phase 10.

## 6. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Cross-site cookie blocked by browser (Safari/Chrome) | Verify in doc 06 §3.4; fallback: custom domain with shared parent domain, or Vercel rewrite proxy `/api/*` → Render so the cookie is first-party |
| Render free tier cold start | "Waking up server" UI; optional uptime ping |
| Floating-point money errors | Integer minor units (D-06) |
| Timezone/month boundary bugs | Group in user timezone; add fixture tests |
| Scope creep | Bonus only after Phase 10 |
| Chart/list mismatch | Charts and list share the same filter builder on server |

## 7. Step-by-Step Owner Journey (summary)
1. Create accounts: GitHub, MongoDB Atlas, Vercel, Render (or Railway). 2. Create Atlas cluster + DB user; copy connection string. 3. Put docs in `/docs`, paste master prompt into Antigravity. 4. Answer Phase 0 questions (or accept defaults). 5. Provide `MONGODB_URI` when asked (Phase 1). 6. Review each phase report; test the running app locally. 7. Provide production secrets/connect repos at Phase 10. 8. (Optional) provide bonus-feature inputs. Full list with reasons: doc 07.
