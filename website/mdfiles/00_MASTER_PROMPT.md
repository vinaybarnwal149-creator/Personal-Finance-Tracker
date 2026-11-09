# MASTER PROMPT — paste into Antigravity

You are a senior full-stack engineer and technical lead. Build the complete "FinTrack" Personal Finance Tracker web application (React + Tailwind frontend, Node/Express + MongoDB backend, JWT auth, Recharts charts, deployed on Vercel + Render + MongoDB Atlas).

## STEP 1 — READ EVERYTHING FIRST
The project documents are in the `/docs` folder of this workspace. Read ALL of them completely, in this order, before writing any code:
1. `01_PRD_Product_Requirements.md` — what to build, requirement IDs, acceptance criteria, locked decisions
2. `02_UIUX_Design_and_Page_Structure.md` — design tokens, pages, components, UX rules
3. `03_Technical_Architecture_and_Stack.md` — stack, folder structure, auth flow, standards
4. `04_Database_and_API_Specification.md` — schemas, endpoints, validation, aggregations
5. `05_Development_Roadmap_and_Implementation_Plan.md` — phases, exit gates, working agreement, PROGRESS.md template
6. `06_Security_Testing_and_Deployment.md` — security checklist, tests, deployment procedure
7. `07_Owner_Inputs_Assets_and_Credentials.md` — what the owner must provide, defaults, how to ask

If documents conflict, precedence is: 01 (requirements) > 04 (data/API) > 03 (architecture) > 02 (UI) > 05 > 06 > 07. Record any conflict you resolve in the Decision Log (doc 03 §10).

## STEP 2 — ANALYZE BEFORE BUILDING
Before development, post a concise **Understanding Summary** (features, pages, data model, API surface, risks) and a **Phase Plan**. Create `PROGRESS.md` at the repo root using the template in doc 05 §4, with every FR ID from doc 01 listed as a checkbox.

## STEP 3 — BUILD AUTOMATICALLY, PHASE BY PHASE
Do NOT stop after planning and do NOT just give me instructions — start building immediately after Step 2, beginning with Phase 1, and continue through the phases in doc 05 in order. For each phase:
- Create all required folders, files, components, pages, API routes, models, validators, tests, and config yourself.
- Follow the specified UI/UX, functionality, architecture, database structure, API contracts, and security rules exactly. Do not skip, rename, or silently change any requirement. Do not make random assumptions: when something is not specified, pick the best option, explain the choice in 1–2 sentences, log it in the Decision Log, and continue.
- If there are multiple valid approaches, recommend the best one and explain why before using it.
- Write clean, scalable, secure, responsive, production-ready code per the standards in doc 03 §8 (layered backend, reusable components, validation everywhere, no hard-coded secrets, no dead code).
- Run lint and tests, start the app, and test the feature in the running app (including mobile widths). Fix every error and warning. A feature is NOT complete until it meets the Definition of Done in doc 05 §3 and the phase Exit Gate passes.
- Update `PROGRESS.md` and commit after every task. At the end of each phase, give me a short report: ✅ done · 🧪 tested · ❓ needed from me · ▶ next phase.

## STEP 4 — ASK ME ONLY WHEN GENUINELY BLOCKED
Use defaults from doc 07 for anything optional. When you truly need something from me (credentials, accounts, assets, or a decision that changes scope or cost), ask in this exact format and keep working on anything unblocked in the meantime:
- **Need:** what
- **Why:** what it unlocks
- **How to get it:** step-by-step instructions for a beginner
- **Where to put it:** exact file/env var (prefer me editing `.env` directly rather than pasting secrets in chat)
- **Meanwhile:** what you'll continue doing

Expected requests: `MONGODB_URI` (Phase 1), accounts/connections and production secrets (Phase 10), SMTP details (bonus only). No payment keys are needed in this project. Never ask for something already specified in the docs.

## RULES
- Build the MVP (all "Must" and "Should" items) completely before any bonus feature; bonus features start only after deployment passes (doc 05 Phase 11).
- Never commit secrets; maintain `.env.example` files; validate env at startup.
- Enforce data isolation (users only ever access their own data) and every item in doc 06 §1 before deployment.
- Use the exact API paths, response envelope, error codes, and money handling from doc 04.
- Use only the libraries listed in doc 03 unless you justify an addition and log it.
- Keep a running list of completed vs pending work in `PROGRESS.md`; never mark something done without verifying it.
- Write the README as described in doc 06 §5.

## BEGIN NOW
Start with Step 1 (read all docs in `/docs`), then Step 2, then immediately proceed into Phase 1 and continue autonomously. Pause only for the Phase-1 `MONGODB_URI` request (if not yet provided) and for real blockers.
