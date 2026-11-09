# 07 — Owner Inputs, Assets & Credentials Checklist
**Project:** FinTrack | **Audience:** project owner AND the AI agent
The agent must reference this file whenever it needs something. Items are grouped by the phase in which they become necessary. **Anything marked "Default" can be skipped — the agent proceeds with the default.**

---

## A. Decisions (Phase 0) — answer or accept defaults
| # | Item | Why needed | Default if not provided |
|---|---|---|---|
| A1 | App name | Branding, titles, README | **FinTrack** |
| A2 | Default currency & locale | Money formatting, seed data | **USD / en-US** (each user can change) |
| A3 | Brand primary color (hex) | Theme | **#4F46E5** (indigo) |
| A4 | Language | UI text | **English only** |
| A5 | Language: JavaScript or TypeScript | Codebase | **JavaScript** |
| A6 | Landing page tagline/copy | Marketing sections | Agent writes placeholder copy |
| A7 | Bonus features wanted (CSV, PDF, recurring, dark mode, PWA, email) | Scope after MVP | **All, in doc 05 §Phase 11 order** |
| A8 | Is this a portfolio demo or a real product for public users? | Affects privacy policy/terms pages and rate limits | **Portfolio demo** |

## B. Accounts to Create (before the phase listed)
| # | Account | Phase | Why | How |
|---|---|---|---|---|
| B1 | **GitHub** account + empty repo | 1 (optional) → 10 (required) | Source control and auto-deploy | github.com → New repository (private or public), name `fintrack` |
| B2 | **MongoDB Atlas** | **1 (required)** | Database | cloud.mongodb.com → free M0 cluster (steps in doc 06 §3.1) |
| B3 | **Vercel** | 10 | Frontend hosting | vercel.com → sign in with GitHub |
| B4 | **Render** (or Railway) | 10 | Backend hosting | render.com → sign in with GitHub |
| B5 | Domain registrar (optional) | 10+ | Custom URL | Any registrar (Namecheap, GoDaddy, Google Domains successor, etc.) |
| B6 | SMTP/email provider (bonus) | 11 | Password reset + monthly reports | Brevo (free), Gmail App Password, or Resend |

## C. Credentials & Configuration Values
| # | Value | Needed in | Why | How to get |
|---|---|---|---|---|
| C1 | `MONGODB_URI` | Phase 1 | Server DB connection | Atlas → Connect → Drivers → copy string, insert password and DB name `fintrack`. Paste into `server/.env` (never into chat logs if avoidable; agent should tell owner to edit the file directly) |
| C2 | `JWT_ACCESS_SECRET` (dev) | Phase 2 | Signs access tokens | Agent generates a dev value. Owner generates a **separate** production one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| C3 | Production `MONGODB_URI` (can reuse cluster, different DB name e.g. `fintrack_prod`) | Phase 10 | Production data separation | Atlas, same steps |
| C4 | `CLIENT_URL` (Vercel URL) | Phase 10 | CORS + cookies | Shown by Vercel after first deploy |
| C5 | `VITE_API_URL` (Render URL + `/api/v1`) | Phase 10 | Frontend → API | Shown by Render after first deploy |
| C6 | SMTP host, port, user, password, from-address | Phase 11 (bonus) | Sending email | From the email provider's dashboard |
| C7 | Demo account credentials to show publicly | Phase 10 | README/login demo button | Default `demo@fintrack.app` / `Demo@1234` |

**Not needed for this project:** payment gateway keys, third-party auth keys (Clerk/Auth0), cloud storage keys, map/analytics keys. (Optional later: Google Analytics/Plausible ID.)

## D. Brand & Content Assets (all optional — defaults exist)
| # | Asset | Format | Where used | Default |
|---|---|---|---|---|
| D1 | Logo (light + dark versions) | SVG preferred, or PNG ≥ 512 px, transparent | Sidebar, auth pages, favicon | Agent creates a simple text/icon logo (wallet/chart icon + app name) |
| D2 | Favicon / app icon | PNG 512×512 (PWA needs 192 & 512, maskable) | Browser tab, PWA | Generated from logo |
| D3 | Brand colors / palette | Hex codes | Theme | doc 02 tokens |
| D4 | Fonts | Google Font name | Typography | Inter |
| D5 | Hero/illustration images | SVG/PNG/WebP, ≤ 300 KB each | Landing, empty states | Agent uses inline SVG illustrations/icons |
| D6 | Landing page text (headline, features, FAQ) | Plain text | Landing | Placeholder copy per doc 02 §5.1 |
| D7 | Figma link or screenshots/mockups | Link or PNG | Layout overrides | Doc 02 layouts |
| D8 | Product screenshots for README | PNG, captured after build | README | Agent adds placeholders; owner replaces at the end |
| D9 | Demo walkthrough video (optional) | MP4/Loom link | README | Skipped |
| D10 | Legal pages text (Privacy/Terms) | Text | Footer links | Simple generated placeholder (only if A8 = real product) |
| D11 | Author name, links (GitHub/LinkedIn), contact email | Text | README, footer | Left as placeholders |

**Where to put assets:** a folder named `/assets-from-owner` at repo root (agent will move/optimize them into `client/public` or `client/src/assets`).

## E. What the Agent Must Do When Something Is Missing
Format every request exactly like this:
> **Need:** `<what>`
> **Why:** `<what it unlocks>`
> **How to get it:** `<numbered steps>`
> **Where to put it:** `<file/env var — or "paste here">`
> **Meanwhile:** `<what I'll continue doing without it>`

Rules: batch related requests into one message; never block on optional items (D-items, bonus items); never ask for something already in the docs; never ask the owner to paste secrets into chat if they can be placed directly in an `.env` file.

## F. Owner Acceptance Checkpoints
| After phase | Owner should verify |
|---|---|
| 2 | Can register, log in, reload, log out |
| 4 | Can add, edit, filter, delete transactions |
| 5–6 | Charts and budgets look right with demo data |
| 8 | App feels good on the owner's phone (use local network URL or deployed preview) |
| 10 | Live site works on phone and laptop; demo login works |
