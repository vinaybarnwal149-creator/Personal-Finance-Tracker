# 04 — Database & API Specification
**Project:** FinTrack | **Depends on:** 01 PRD, 03 Architecture
Base URL: `/api/v1` | Format: JSON | Auth: `Authorization: Bearer <accessToken>` unless marked **Public**.

---

## 1. API Conventions
### 1.1 Response envelope
**Success**
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 } }
```
`meta` only for paginated lists.
**Error**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [{ "field": "amount", "message": "Amount must be greater than 0" }] } }
```
### 1.2 Error codes
| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | zod validation failed |
| 400 | `INVALID_ID` | malformed ObjectId |
| 401 | `UNAUTHORIZED` | missing/invalid/expired access token |
| 401 | `INVALID_CREDENTIALS` | bad email/password |
| 401 | `REFRESH_INVALID` | refresh token missing/expired/revoked |
| 404 | `NOT_FOUND` | resource missing or not owned by user |
| 409 | `DUPLICATE` | unique constraint (email, category name, budget) |
| 409 | `CATEGORY_IN_USE` | deleting category with transactions and no `reassignTo` |
| 422 | `BUSINESS_RULE` | e.g., category type ≠ transaction type |
| 429 | `RATE_LIMITED` | too many requests |
| 500 | `INTERNAL_ERROR` | unexpected |
### 1.3 Money
API accepts/returns `amount` as a **decimal number with ≤ 2 decimals** (e.g., `1234.56`). The server converts to integer `amountMinor` (`Math.round(amount*100)`) for storage and divides on output via a `toJSON` transform. Never expose `amountMinor` publicly. Aggregations compute in minor units and divide at the end.
### 1.4 Dates
ISO 8601 strings. Transaction `date` is stored as a UTC `Date`; the client sends `YYYY-MM-DD` or full ISO. Month keys are `YYYY-MM`. Grouping uses the user's `timezone`.
### 1.5 IDs
Mongo ObjectIds exposed as string `id` (Mongoose `toJSON` transform: `_id → id`, remove `__v`).

---

## 2. Database Collections (MongoDB / Mongoose)

### 2.1 `users`
| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required, trim, 2–60 |
| `email` | String | required, unique, lowercase, trim, valid email |
| `passwordHash` | String | required, `select:false` |
| `currency` | String | ISO 4217, default `"USD"` (owner-configurable default) |
| `timezone` | String | IANA tz, default `"UTC"` |
| `locale` | String | default `"en-US"` |
| `theme` | String | `light`/`dark`/`system`, default `system` (bonus) |
| `createdAt`, `updatedAt` | Date | timestamps |
Indexes: `{ email: 1 }` unique.

### 2.2 `refreshtokens`
| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId→User | required, indexed |
| `tokenHash` | String | SHA-256 hex, unique |
| `expiresAt` | Date | TTL index `{expiresAt:1}, expireAfterSeconds:0` |
| `revokedAt` | Date | null by default |
| `replacedByHash` | String | optional (rotation chain) |
| `userAgent`, `ip` | String | optional |
| `createdAt` | Date | |

### 2.3 `categories`
| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId→User | required |
| `name` | String | required, trim, 1–40 |
| `type` | String | enum `income`/`expense`, required |
| `color` | String | hex `#RRGGBB`, default from palette |
| `icon` | String | key from preset icon list, default `tag` |
| `isDefault` | Boolean | true for seeded ones |
| `createdAt`, `updatedAt` | Date | |
Indexes: unique `{ user:1, type:1, nameLower:1 }` (store `nameLower` or use collation strength 2).

### 2.4 `transactions`
| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId→User | required |
| `type` | String | enum `income`/`expense`, required |
| `amountMinor` | Number (integer) | required, ≥ 1, ≤ 99,999,999,999 |
| `category` | ObjectId→Category | required |
| `date` | Date | required |
| `note` | String | ≤ 500, trim, default `""` |
| `paymentMethod` | String | enum `cash`,`card`,`bank_transfer`,`digital_wallet`,`other`; optional |
| `recurringRule` | ObjectId→RecurringRule | optional (bonus) |
| `createdAt`, `updatedAt` | Date | |
Indexes: `{ user:1, date:-1 }`, `{ user:1, type:1, date:-1 }`, `{ user:1, category:1, date:-1 }`, text index on `note` optional (or case-insensitive regex with escaped input).
Virtual `amount = amountMinor/100` in toJSON.

### 2.5 `budgets`
| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId→User | required |
| `category` | ObjectId→Category \| null | null = overall monthly budget; must be an expense category |
| `month` | String | `YYYY-MM`, required |
| `limitMinor` | Number (integer) | required, ≥ 1 |
| `createdAt`, `updatedAt` | Date | |
Indexes: unique `{ user:1, month:1, category:1 }` (null allowed once per user+month).

### 2.6 `recurringrules` (Bonus)
`user`, `type`, `amountMinor`, `category`, `note`, `paymentMethod`, `frequency` (`daily|weekly|monthly`), `startDate`, `endDate?`, `nextRunDate`, `isActive`, timestamps. Index `{ isActive:1, nextRunDate:1 }`.

### 2.7 Entity relationships
`User 1─* Category`, `User 1─* Transaction`, `Category 1─* Transaction`, `User 1─* Budget`, `Category 1─* Budget`, `User 1─* RefreshToken`.

## 3. Seed Data
### 3.1 Seeder behavior (`npm run seed`)
Creates demo user `demo@fintrack.app` / `Demo@1234` (name "Demo User", currency from env `DEMO_CURRENCY` default USD), default categories, ~6 months of transactions (≈ 8–15/month: salary on 1st, rent, groceries, transport, dining, entertainment, utilities, occasional freelance income), and budgets for the current month. `seed:reset` deletes the demo user's data first. Must refuse to run when `NODE_ENV=production` unless `--force`.
### 3.2 Default categories (seeded for every new user)
**Expense:** Food & Dining `#F97316 utensils`, Groceries `#84CC16 shopping-cart`, Rent & Housing `#6366F1 home`, Utilities `#06B6D4 zap`, Transport `#14B8A6 car`, Health `#F43F5E heart-pulse`, Entertainment `#A855F7 film`, Shopping `#EC4899 shopping-bag`, Education `#8B5CF6 graduation-cap`, Travel `#F59E0B plane`, Subscriptions `#64748B repeat`, Other `#94A3B8 tag`.
**Income:** Salary `#10B981 briefcase`, Freelance `#22C55E laptop`, Investments `#0EA5E9 trending-up`, Gifts `#EC4899 gift`, Other `#94A3B8 tag`.

---

## 4. Endpoints

### 4.1 Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | `{ status:"ok", uptime, timestamp, db:"connected" }` |

### 4.2 Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create user, seed categories, log in |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Cookie | Rotate refresh, return new access token |
| POST | `/auth/logout` | Cookie | Revoke refresh token, clear cookie |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/forgot-password` | Public | Bonus — email reset link (always 200) |
| POST | `/auth/reset-password` | Public | Bonus — body `{token, password}` |
Rate limit: `/auth/login`, `/auth/register`, `/auth/forgot-password` → 10 req / 15 min / IP.

**POST /auth/register** — body
```json
{ "name": "Asha Rao", "email": "asha@example.com", "password": "Passw0rdX", "currency": "USD", "timezone": "Asia/Kolkata" }
```
Response `201`
```json
{ "success": true, "data": { "user": { "id": "...", "name": "Asha Rao", "email": "asha@example.com", "currency": "USD", "timezone": "Asia/Kolkata" }, "accessToken": "<jwt>" } }
```
(+ `Set-Cookie: refreshToken=...`)
**POST /auth/login** — body `{ "email", "password" }` → same response shape, `200`.
**POST /auth/refresh** → `200 { data: { accessToken, user } }`.
**POST /auth/logout** → `200 { data: { message: "Logged out" } }`.

### 4.3 Users
| Method | Path | Description |
|---|---|---|
| PATCH | `/users/me` | Update `name`, `currency`, `timezone`, `locale`, `theme` |
| PATCH | `/users/me/password` | Body `{currentPassword, newPassword}`; revoke all refresh tokens except current |
| DELETE | `/users/me` | Body `{password}`; delete user + categories + transactions + budgets + tokens |

### 4.4 Categories
| Method | Path | Description |
|---|---|---|
| GET | `/categories?type=expense` | List own categories (sorted by name) |
| POST | `/categories` | `{name, type, color?, icon?}` |
| PATCH | `/categories/:id` | `{name?, color?, icon?}` (type immutable if transactions exist) |
| DELETE | `/categories/:id?reassignTo=<id>` | If in use and no `reassignTo` → `409 CATEGORY_IN_USE` with `details:{count}`; `reassignTo` must be same type; budgets for deleted category are removed |

### 4.5 Transactions
| Method | Path | Description |
|---|---|---|
| POST | `/transactions` | Create |
| GET | `/transactions` | List (filters below) |
| GET | `/transactions/:id` | One |
| PATCH | `/transactions/:id` | Update any subset of fields |
| DELETE | `/transactions/:id` | Delete (returns `{id}`) |
| GET | `/transactions/export?format=csv` | Bonus — same filters, streams file |
| DELETE | `/transactions` | **Not implemented** (no bulk delete in MVP) |

**POST body**
```json
{ "type": "expense", "amount": 42.5, "category": "<categoryId>", "date": "2025-03-14", "note": "Dinner with friends", "paymentMethod": "card" }
```
**Response `201`** `data`:
```json
{ "id": "...", "type": "expense", "amount": 42.5, "category": { "id": "...", "name": "Food & Dining", "color": "#F97316", "icon": "utensils", "type": "expense" }, "date": "2025-03-14T00:00:00.000Z", "note": "Dinner with friends", "paymentMethod": "card", "createdAt": "...", "updatedAt": "..." }
```
Also returns `budgetAlerts` (array) in `data` for create/update of expenses: `[{ "scope": "category"|"overall", "categoryId", "categoryName", "percent": 85, "status": "warning"|"exceeded" }]` — empty if none. This powers FR-BUD-03.
**Validation:** `amount` number > 0, ≤ 2 decimals; `date` valid, not more than 1 year in the future; `category` must exist, belong to user, and `category.type === type` else `422 BUSINESS_RULE`.

**GET query params**
| Param | Type | Notes |
|---|---|---|
| `page` | int ≥1 | default 1 |
| `limit` | int 1–100 | default 20 |
| `type` | `income\|expense` | |
| `category` | comma-separated ids | |
| `from`, `to` | `YYYY-MM-DD` | inclusive, in user timezone |
| `q` | string ≤100 | case-insensitive search in note (escape regex) |
| `minAmount`, `maxAmount` | number | |
| `paymentMethod` | enum | |
| `sort` | `-date` (default), `date`, `-amount`, `amount` | tie-break by `_id` desc |
Response `meta` has pagination; `data` is an array. Also include `meta.totals: { income, expense, net, count }` for the filtered set (used by the summary strip).

### 4.6 Stats
All accept `from`, `to` (default: current month in user tz) and optional `type`/`category` where noted.
| Method | Path | Response `data` |
|---|---|---|
| GET | `/stats/summary` | `{ income, expense, balance, savingsRate, count, previous: { income, expense, balance }, changePct: { income, expense, balance } }` (previous = equal-length preceding period) |
| GET | `/stats/by-category?type=expense` | `[{ categoryId, name, color, total, percent, count }]` sorted desc |
| GET | `/stats/monthly?months=6` | `[{ month: "2025-03", income, expense, net }]` ascending, zero-filled for missing months; `months` 1–12; optional `endMonth` |
| GET | `/stats/daily` | `[{ date: "2025-03-14", income, expense }]` zero-filled across the period |
| GET | `/stats/top-transactions?limit=5&type=expense` | largest transactions in period |

### 4.7 Budgets
| Method | Path | Description |
|---|---|---|
| GET | `/budgets?month=YYYY-MM` | Budgets with computed progress (below) |
| PUT | `/budgets` | Upsert: `{ month, category|null, limit }` |
| DELETE | `/budgets/:id` | Delete |
| POST | `/budgets/copy` | `{ fromMonth, toMonth }` copies missing budgets; returns created count |
Progress item:
```json
{ "id": "...", "month": "2025-03", "category": { "id": "...", "name": "Groceries", "color": "#84CC16", "icon": "shopping-cart" }, "limit": 400, "spent": 332.4, "remaining": 67.6, "percent": 83, "status": "warning" }
```
`category: null` for overall (spent = all expenses that month). Status: `ok` < 80, `warning` 80–100, `exceeded` > 100.

## 5. Validation Rules Summary (zod)
- `email`: valid, ≤ 254 chars, lowercased. `password`: 8–72 chars, ≥1 letter, ≥1 number. `name`: 2–60.
- `currency`: one of supported list (USD, EUR, GBP, INR, JPY, AUD, CAD, AED, SGD, CNY, BRL, ZAR, …) — keep in shared constant.
- `timezone`: valid IANA (check with `Intl.supportedValuesOf('timeZone')` or try `new Intl.DateTimeFormat(undefined,{timeZone})`).
- `note`: strip control chars; React escapes on output (never `dangerouslySetInnerHTML`).
- `month`: `/^\d{4}-(0[1-9]|1[0-2])$/`.
- Unknown body fields are rejected/stripped (`.strict()`).

## 6. Aggregation Reference (implementation guidance)
**Summary:** `$match {user, date:{$gte:from,$lt:toExclusive}}` → `$group {_id:"$type", total:{$sum:"$amountMinor"}, count:{$sum:1}}`.
**By category:** `$match` (+type) → `$group {_id:"$category", total, count}` → `$lookup categories` → `$project` → `$sort {total:-1}`; compute percent in service.
**Monthly:** `$match` range → `$group {_id:{m:{$dateToString:{format:"%Y-%m", date:"$date", timezone:tz}}, type:"$type"}, total}` → pivot in service → zero-fill months.
**Daily:** same with `%Y-%m-%d`.
**Budget progress:** one aggregation of expense totals per category for the month, then merge with budgets in service (avoid N+1 queries).
Month boundaries computed in user timezone, converted to UTC for `$match`.

## 7. Data Integrity Rules
- Deleting a user cascades to all owned collections (transaction-safe order; use a Mongo session if available on Atlas).
- Category deletion with `reassignTo` runs `updateMany` on transactions, then removes the category and its budgets.
- Changing a transaction's `type` requires choosing a category of the new type (validated).
- Never trust `user` in request bodies; always set from `req.user.id`.
