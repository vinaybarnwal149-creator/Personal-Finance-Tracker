# FinTrack — Modern Personal Finance Tracker & Budgeting Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![Node: 20+](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/)
[![React: 18](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite: 5](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![Tailwind: 3.4](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://fintrack-one-black.vercel.app)

**FinTrack** is an enterprise-grade, privacy-first personal finance tracking and budgeting platform. It empowers users to record income and expenses, monitor category spending, set dynamic monthly budgets with automated threshold warnings, and visualize financial health through interactive analytics and charts.

🌐 **Live Demo:** [https://fintrack-one-black.vercel.app](https://fintrack-one-black.vercel.app)  
📦 **Repository:** [https://github.com/vinaybarnwal149-creator/Personal-Finance-Tracker.git](https://github.com/vinaybarnwal149-creator/Personal-Finance-Tracker.git)

---

## 📐 System Architecture

### 1. High-Level Deployment Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER (Vercel)                               │
│  React 18 SPA · Vite 5 · Tailwind CSS · React Router 6 · Recharts · Lucide Icons  │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │ HTTPS / REST (JSON + Secure Cookies)
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           SERVERLESS API TIER (Vercel)                            │
│  Express 4 / Node.js Runtime · Reverse Proxy Trust · Helmet · Rate Limiter        │
│  JWT Authentication · Zod Request Validators · Service Layer Business Logic       │
└───────────────────────┬───────────────────────────────────┬───────────────────────┘
                        │ (Cloud Persistence Mode)          │ (Dedicated DB Mode)
                        ▼                                   ▼
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│        VERCEL BLOB STORAGE             │ │          MONGODB ATLAS CLOUD           │
│  Atomic state persistence across       │ │  Mongoose 8 Object Modeling            │
│  ephemeral serverless instances        │ │  Full ACID transactions & Aggregations │
└────────────────────────────────────────┘ └────────────────────────────────────────┘
```

### 2. Request & Authentication Flow

```
[User Browser]
      │
      ├── 1. POST /api/v1/auth/login ───────────► [Express Auth Service]
      │                                                   │
      │   ◄── Access Token (Memory) + Refresh (Cookie) ───┤ (Bcrypt validation)
      │
      ├── 2. POST /api/v1/transactions ─────────► [Transaction Controller]
      │      (Bearer JWT in Auth Header)                  │
      │                                                   ├── [Zod Schema Validation]
      │                                                   ├── [User Isolation Filter]
      │                                                   └── [Persist & Check Budget]
      │   ◄── Transaction Object + Budget Alerts ─────────┤
      │
      └── 3. GET /api/v1/stats/summary ─────────► [Stats Aggregation Engine]
          ◄── Totals, Balance, % Savings Rate ────────────┘
```

---

## 🌟 Key Features

- **🛡️ Strict Multi-Tenant Isolation:** Zero data leaks. Every user account starts with strictly zero transactions and zero dummy budgets. Every database query enforces the authenticated user's ID (`req.user.id`). Foreign resource accesses safely return `404 Not Found`.
- **🔐 Enterprise Authentication:** Short-lived access JWTs stored in memory, paired with revolving refresh tokens in `httpOnly`, `sameSite`, `secure` cookies. Built-in token reuse/theft detection automatically revokes all user sessions.
- **💸 Transaction Management:**
  - Create, view, update, and delete income and expense transactions.
  - Multi-criteria filtering: transaction type, categories, date ranges, search query (regex-escaped), and amount boundaries.
  - Optimistic deletions with automated rollback upon network errors.
  - Minor-unit integer money storage (`amountMinor`) preventing floating-point rounding errors.
- **🎯 Dynamic Budgets & Automated Alerts:**
  - Overall monthly budget and category-specific budget limits.
  - Real-time progress tracking: Healthy (<80%), Warning (80%–100%), and Exceeded (>100%).
  - Proactive warning toasts alert users the instant an added expense crosses budget limits.
- **📊 Rich Interactive Visualizations:**
  - Monthly cashflow comparisons (Recharts bar charts).
  - Spending distribution across categories (Donut charts).
  - Income vs Expense trend over time with responsive mobile scaling.
  - Accessible tables toggleable for screen-reader users.
- **🏷️ Customizable Categories:** Pre-configured default income and expense categories, custom color palettes, and safe category deletion with mandatory transaction reassignment.
- **📱 Fully Responsive Design:** Clean desktop dashboard with collapsible navigation, seamlessly adapting to mobile bottom tab navigation (tested across 360px to 1920px viewports).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.4, React Router 6, Recharts, Lucide Icons, React Hot Toast, Axios |
| **Backend API** | Node.js 20+, Express.js 4, Mongoose 8, Zod Validation, Cookie Parser, CORS |
| **Persistence** | Vercel Blob Storage (Serverless persistence) / MongoDB Atlas (ACID Database) |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` (cost 12), `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `hpp` |
| **Testing** | Jest 29, Supertest 7, `mongodb-memory-server` |
| **Hosting & CI/CD** | Vercel (Client & Serverless API), GitHub |

---

## 📂 Repository Structure

```
Personal-Finance-Tracker/
├── .gitignore                   # Comprehensive rule set excluding confidential secrets
├── README.md                    # Project documentation & architecture
├── vercel.json                  # Serverless function and SPA rewrite routes
├── package.json                 # Monorepo root workspace configuration
│
├── client/                      # React + Vite Frontend
│   ├── public/                  # Static assets & icons
│   ├── src/
│   │   ├── api/                 # Axios instance with auto-refresh interceptors
│   │   ├── components/
│   │   │   ├── charts/          # MonthlyBarChart, CategoryDonutChart, TrendLineChart
│   │   │   ├── features/        # TransactionModal, SummaryCards, BudgetSnapshot
│   │   │   ├── layout/          # Navbar, Sidebar, MobileNav
│   │   │   └── ui/              # Button, Input, Select, Modal, EmptyState, Skeleton
│   │   ├── context/             # AuthContext, DataRefreshContext
│   │   ├── pages/               # Dashboard, Transactions, Budgets, Reports, Settings, Auth
│   │   └── utils/               # formatCurrency, formatDate, periods
│   ├── vite.config.js
│   └── package.json
│
└── server/                      # Express REST API
    ├── src/
    │   ├── config/              # Environment parser, DB connectors, CORS setup
    │   ├── controllers/         # HTTP request/response controllers
    │   ├── middleware/          # JWT authentication, validation, error handlers
    │   ├── models/              # Mongoose models (User, Transaction, Budget, Category)
    │   ├── routes/              # Express API routers (/auth, /transactions, /budgets, /stats)
    │   ├── services/            # Business logic, aggregations, demo store, blob storage
    │   ├── utils/               # Money conversion, custom ApiError, winston logger
    │   └── validators/          # Zod schema request validators
    ├── tests/                   # Automated integration test suites
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v9.x` or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/vinaybarnwal149-creator/Personal-Finance-Tracker.git
cd Personal-Finance-Tracker
```

### 2. Configure Environment Variables
Copy the sample environment templates:
```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

#### `server/.env.example`
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fintrack
JWT_ACCESS_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=7
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
BCRYPT_COST=12
```

#### `client/.env.example`
```ini
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=FinTrack
```

### 3. Install Dependencies
```bash
# Install root and workspace dependencies
npm install
npm install --prefix client
npm install --prefix server
```

### 4. Run Development Servers
```bash
# Run both client and server concurrently
npm run dev
```
- Client runs on: `http://localhost:5173`
- API runs on: `http://localhost:5000`

---

## 🧪 Testing

The test suite covers end-to-end integration tests using Jest, Supertest, and `mongodb-memory-server`:

```bash
npm run test --prefix server
```

```
Test Suites: 5 passed, 5 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        ~12s
```

Tested scenarios include:
- `FR-AUTH-01`: User registration, password hashing, and token issuance.
- `FR-DATA-01`: Multi-tenant isolation (User A cannot view or edit User B's transactions).
- `FR-DATA-02`: Clean empty state initialization on brand new accounts.
- `FR-BUDGET-01`: Automated threshold calculation and alert generation.
- `FR-TXN-01`: Query filtering, sorting, pagination, and monetary precision.

---

## 📡 API Reference

| Endpoint | Method | Description | Auth Required |
|---|---|---|:---:|
| `/api/v1/auth/register` | `POST` | Register a new user account | No |
| `/api/v1/auth/login` | `POST` | Authenticate user and issue tokens | No |
| `/api/v1/auth/refresh` | `POST` | Rotate and issue fresh access token | Cookie |
| `/api/v1/auth/logout` | `POST` | Invalidate active refresh token | Cookie |
| `/api/v1/auth/me` | `GET` | Get authenticated user profile | Bearer JWT |
| `/api/v1/transactions` | `GET` | Filter and paginate transactions | Bearer JWT |
| `/api/v1/transactions` | `POST` | Record a new income/expense | Bearer JWT |
| `/api/v1/transactions/:id` | `PATCH` | Update existing transaction | Bearer JWT |
| `/api/v1/transactions/:id` | `DELETE` | Delete transaction record | Bearer JWT |
| `/api/v1/categories` | `GET` | List user expense/income categories | Bearer JWT |
| `/api/v1/categories` | `POST` | Create a custom category | Bearer JWT |
| `/api/v1/budgets` | `GET` | List active budgets and spending status | Bearer JWT |
| `/api/v1/budgets` | `POST` | Upsert monthly budget limit | Bearer JWT |
| `/api/v1/stats/summary` | `GET` | Balance, income, expense, and savings rate | Bearer JWT |
| `/api/v1/stats/monthly` | `GET` | 6-month comparative cashflow history | Bearer JWT |
| `/api/v1/stats/by-category` | `GET` | Category spending percentage breakdown | Bearer JWT |
| `/api/v1/health` | `GET` | System health and database status | No |

---

## 🔒 Security Best Practices Implemented

1. **No Sensitive Files Committed:** All `.env`, credentials, secrets, build outputs, and local databases are strictly excluded in `.gitignore`.
2. **Timing Safe Comparison:** Protected against timing attacks on authentication credentials.
3. **NoSQL Injection Defense:** Sanitization via `express-mongo-sanitize` strips `$` and `.` operators from client inputs.
4. **Header Hardening:** Standard HTTP security headers enabled via `helmet`.
5. **Rate Limiting:** Protects against brute-force attacks on auth endpoints.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
