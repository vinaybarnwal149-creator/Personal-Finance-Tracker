import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { put, get } from '@vercel/blob';
import { env } from '../config/env.js';
import { DEFAULT_CATEGORIES, TRANSACTION_TYPES, PAYMENT_METHODS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';

// Multi-tenant in-memory data store
// Isolated per userId
const users = new Map(); // userId -> user
const usersByEmail = new Map(); // email.toLowerCase() -> user
const userCategories = new Map(); // userId -> Array<category>
const userTransactions = new Map(); // userId -> Array<transaction>
const userBudgets = new Map(); // userId -> Array<budget>
const refreshTokens = new Map(); // tokenString -> { userId, expiresAt }

const BLOB_PATH = 'fintrack-store-data.json';
const BLOB_STORE_ID = process.env.BLOB_STORE_ID || 'store_RChyBw6zkySiWRf0';
const isBlobEnabled = Boolean(
  process.env.BLOB_STORE_ID ||
  process.env.VERCEL ||
  process.env.VERCEL_OIDC_TOKEN
);

function serializeState() {
  return {
    users: Array.from(users.entries()),
    usersByEmail: Array.from(usersByEmail.entries()),
    userCategories: Array.from(userCategories.entries()),
    userTransactions: Array.from(userTransactions.entries()),
    userBudgets: Array.from(userBudgets.entries()),
    refreshTokens: Array.from(refreshTokens.entries()),
  };
}

function loadState(data) {
  if (!data) return;
  if (Array.isArray(data.users)) {
    for (const [k, v] of data.users) users.set(k, v);
  }
  if (Array.isArray(data.usersByEmail)) {
    for (const [k, v] of data.usersByEmail) usersByEmail.set(k, v);
  }
  if (Array.isArray(data.userCategories)) {
    for (const [k, v] of data.userCategories) userCategories.set(k, v);
  }
  if (Array.isArray(data.userTransactions)) {
    for (const [k, v] of data.userTransactions) userTransactions.set(k, v);
  }
  if (Array.isArray(data.userBudgets)) {
    for (const [k, v] of data.userBudgets) userBudgets.set(k, v);
  }
  if (Array.isArray(data.refreshTokens)) {
    for (const [k, v] of data.refreshTokens) refreshTokens.set(k, v);
  }
}

let lastSyncTime = 0;
async function syncFromBlob() {
  if (!isBlobEnabled) return;

  try {
    const res = await get(BLOB_PATH, {
      storeId: BLOB_STORE_ID,
      access: 'private',
    });
    if (res && res.stream) {
      const data = await new Response(res.stream).json();
      loadState(data);
      lastSyncTime = Date.now();
    }
  } catch (err) {
    if (!err.message?.includes('not found') && !err.message?.includes('404')) {
      console.warn('Blob sync warning:', err.message);
    }
  }
}

async function persistToBlob() {
  if (!isBlobEnabled) return;
  try {
    const state = serializeState();
    await put(BLOB_PATH, JSON.stringify(state), {
      access: 'private',
      storeId: BLOB_STORE_ID,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    lastSyncTime = Date.now();
  } catch (err) {
    console.error('Blob persist error:', err.message);
  }
}

function createDefaultCategories(userId) {
  const cats = [];
  let counter = 1;
  for (const cat of DEFAULT_CATEGORIES.expense) {
    cats.push({
      id: `cat_exp_${userId}_${counter++}`,
      name: cat.name,
      type: 'expense',
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
    });
  }
  for (const cat of DEFAULT_CATEGORIES.income) {
    cats.push({
      id: `cat_inc_${userId}_${counter++}`,
      name: cat.name,
      type: 'income',
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
    });
  }
  return cats;
}

// Initialize demo user ONLY for demo@fintrack.app
const DEMO_USER = {
  id: 'demo_user_123',
  name: 'Demo User',
  email: 'demo@fintrack.app',
  password: 'Demo@1234',
  currency: 'USD',
  timezone: 'UTC',
  locale: 'en-US',
};

users.set(DEMO_USER.id, DEMO_USER);
usersByEmail.set(DEMO_USER.email.toLowerCase(), DEMO_USER);

const demoCats = createDefaultCategories(DEMO_USER.id);
userCategories.set(DEMO_USER.id, demoCats);

// Seed sample data ONLY for demo_user_123
const demoTxns = [];
const initNow = new Date();
let txnCounter = 1;

for (let m = 5; m >= 0; m--) {
  const year = initNow.getFullYear();
  const month = initNow.getMonth() - m;

  const salaryCat = demoCats.find((c) => c.name === 'Salary');
  if (salaryCat) {
    demoTxns.push({
      id: `txn_demo_${txnCounter++}`,
      user: DEMO_USER.id,
      userId: DEMO_USER.id,
      type: 'income',
      amount: 4500,
      amountMinor: 450000,
      category: salaryCat,
      date: new Date(year, month, 1, 9, 0).toISOString(),
      note: 'Monthly salary deposit',
      paymentMethod: 'bank_transfer',
      createdAt: new Date(year, month, 1).toISOString(),
    });
  }

  const rentCat = demoCats.find((c) => c.name === 'Rent & Housing');
  if (rentCat) {
    demoTxns.push({
      id: `txn_demo_${txnCounter++}`,
      user: DEMO_USER.id,
      userId: DEMO_USER.id,
      type: 'expense',
      amount: 1350,
      amountMinor: 135000,
      category: rentCat,
      date: new Date(year, month, 2, 10, 0).toISOString(),
      note: 'Apartment rent payment',
      paymentMethod: 'bank_transfer',
      createdAt: new Date(year, month, 2).toISOString(),
    });
  }

  const grocCat = demoCats.find((c) => c.name === 'Groceries');
  if (grocCat) {
    demoTxns.push({
      id: `txn_demo_${txnCounter++}`,
      user: DEMO_USER.id,
      userId: DEMO_USER.id,
      type: 'expense',
      amount: 130,
      amountMinor: 13000,
      category: grocCat,
      date: new Date(year, month, 4, 18, 0).toISOString(),
      note: 'Weekly grocery shopping',
      paymentMethod: 'card',
      createdAt: new Date(year, month, 4).toISOString(),
    });
  }
}
userTransactions.set(DEMO_USER.id, demoTxns);

const currentMonthKey = `${initNow.getFullYear()}-${String(initNow.getMonth() + 1).padStart(2, '0')}`;
const demoBudgets = [
  {
    id: 'budget_demo_1',
    user: DEMO_USER.id,
    userId: DEMO_USER.id,
    month: currentMonthKey,
    category: demoCats.find((c) => c.name === 'Rent & Housing'),
    limit: 1400,
  },
  {
    id: 'budget_demo_2',
    user: DEMO_USER.id,
    userId: DEMO_USER.id,
    month: currentMonthKey,
    category: demoCats.find((c) => c.name === 'Groceries'),
    limit: 600,
  },
  {
    id: 'budget_demo_3',
    user: DEMO_USER.id,
    userId: DEMO_USER.id,
    month: currentMonthKey,
    category: null, // Overall
    limit: 3000,
  },
];
userBudgets.set(DEMO_USER.id, demoBudgets);

export class DemoStore {
  // --- AUTHENTICATION ---
  static async login(email, password) {
    await syncFromBlob();
    const user = usersByEmail.get(email.toLowerCase().trim());
    if (!user || user.password !== password) {
      throw ApiError.invalidCredentials();
    }

    const accessToken = jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    refreshTokens.set(rawRefreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    await persistToBlob();

    const { password: _, ...userSafe } = user;
    return {
      user: userSafe,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  static async register(data) {
    await syncFromBlob();
    const existing = usersByEmail.get(data.email.toLowerCase().trim());
    if (existing) {
      throw ApiError.duplicate('An account with this email already exists');
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const user = {
      id: userId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      currency: data.currency || 'USD',
      timezone: data.timezone || 'UTC',
      locale: 'en-US',
    };

    users.set(userId, user);
    usersByEmail.set(user.email, user);

    // Seed ONLY default categories for new user
    const defaultCats = createDefaultCategories(userId);
    userCategories.set(userId, defaultCats);

    // Initial transactions and budgets are strictly EMPTY for new users
    userTransactions.set(userId, []);
    userBudgets.set(userId, []);

    const accessToken = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    refreshTokens.set(rawRefreshToken, {
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    await persistToBlob();

    const { password: _, ...userSafe } = user;
    return {
      user: userSafe,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  static async refresh(rawRefreshToken) {
    await syncFromBlob();
    if (!rawRefreshToken || !refreshTokens.has(rawRefreshToken)) {
      throw ApiError.refreshInvalid('Invalid refresh token');
    }

    const tokenData = refreshTokens.get(rawRefreshToken);
    if (Date.now() > tokenData.expiresAt) {
      refreshTokens.delete(rawRefreshToken);
      await persistToBlob();
      throw ApiError.refreshInvalid('Refresh token expired');
    }

    const user = users.get(tokenData.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Rotate refresh token
    refreshTokens.delete(rawRefreshToken);
    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    refreshTokens.set(newRefreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    await persistToBlob();

    const accessToken = jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const { password: _, ...userSafe } = user;
    return {
      user: userSafe,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(rawRefreshToken) {
    await syncFromBlob();
    if (rawRefreshToken && refreshTokens.has(rawRefreshToken)) {
      refreshTokens.delete(rawRefreshToken);
      await persistToBlob();
    }
    return { message: 'Logged out successfully' };
  }

  static async getMe(userId) {
    await syncFromBlob();
    const user = users.get(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    const { password: _, ...userSafe } = user;
    return userSafe;
  }

  static async updateProfile(userId, data) {
    await syncFromBlob();
    const user = users.get(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (data.name) user.name = data.name;
    if (data.currency) user.currency = data.currency;
    if (data.timezone) user.timezone = data.timezone;
    if (data.locale) user.locale = data.locale;
    await persistToBlob();
    const { password: _, ...userSafe } = user;
    return userSafe;
  }

  // --- CATEGORIES ---
  static async listCategories(userId, type) {
    await syncFromBlob();
    let cats = userCategories.get(userId);
    if (!cats) {
      cats = createDefaultCategories(userId);
      userCategories.set(userId, cats);
      await persistToBlob();
    }
    if (type) {
      return cats.filter((c) => c.type === type);
    }
    return [...cats];
  }

  static async createCategory(userId, data) {
    await syncFromBlob();
    const cats = userCategories.get(userId) || [];
    const newCat = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: data.name,
      type: data.type,
      color: data.color || '#6366F1',
      icon: data.icon || 'tag',
      isDefault: false,
    };
    cats.push(newCat);
    userCategories.set(userId, cats);
    await persistToBlob();
    return newCat;
  }

  static async updateCategory(userId, categoryId, data) {
    await syncFromBlob();
    const cats = userCategories.get(userId) || [];
    const cat = cats.find((c) => c.id === categoryId);
    if (!cat) throw ApiError.notFound('Category not found');
    if (data.name) cat.name = data.name;
    if (data.color) cat.color = data.color;
    if (data.icon) cat.icon = data.icon;
    await persistToBlob();
    return cat;
  }

  static async deleteCategory(userId, categoryId) {
    await syncFromBlob();
    const cats = userCategories.get(userId) || [];
    const idx = cats.findIndex((c) => c.id === categoryId);
    if (idx !== -1) {
      cats.splice(idx, 1);
      await persistToBlob();
    }
    return { id: categoryId, message: 'Category deleted successfully' };
  }

  // --- TRANSACTIONS ---
  static async listTransactions(userId, query = {}) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    let list = [...txns];

    if (query.type && (query.type === 'income' || query.type === 'expense')) {
      list = list.filter((t) => t.type === query.type);
    }
    if (query.category && String(query.category).trim() !== '') {
      const catIds = query.category.split(',').map((s) => s.trim()).filter(Boolean);
      if (catIds.length > 0) {
        list = list.filter((t) => catIds.includes(t.category?.id || t.category));
      }
    }
    if (query.q && String(query.q).trim() !== '') {
      const qLower = query.q.trim().toLowerCase();
      list = list.filter((t) => t.note?.toLowerCase().includes(qLower));
    }
    if (query.from && String(query.from).trim() !== '') {
      const fromDate = new Date(query.from);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setUTCHours(0, 0, 0, 0);
        list = list.filter((t) => new Date(t.date) >= fromDate);
      }
    }
    if (query.to && String(query.to).trim() !== '') {
      const toDate = new Date(query.to);
      if (!isNaN(toDate.getTime())) {
        toDate.setUTCHours(23, 59, 59, 999);
        list = list.filter((t) => new Date(t.date) <= toDate);
      }
    }
    if (query.minAmount !== undefined && query.minAmount !== null && String(query.minAmount).trim() !== '') {
      list = list.filter((t) => t.amount >= Number(query.minAmount));
    }
    if (query.maxAmount !== undefined && query.maxAmount !== null && String(query.maxAmount).trim() !== '') {
      list = list.filter((t) => t.amount <= Number(query.maxAmount));
    }

    // Sort
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Totals
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of list) {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        totals: {
          income: totalIncome,
          expense: totalExpense,
          net: Number((totalIncome - totalExpense).toFixed(2)),
          count: total,
        },
      },
    };
  }

  static async createTransaction(userId, data) {
    await syncFromBlob();
    const cats = userCategories.get(userId) || [];
    const cat = cats.find((c) => c.id === data.category) || {
      id: data.category,
      name: 'Custom',
      color: '#6366F1',
    };

    const txn = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user: userId,
      userId,
      type: data.type,
      amount: Number(data.amount),
      amountMinor: Math.round(Number(data.amount) * 100),
      category: cat,
      date: new Date(data.date).toISOString(),
      note: data.note || '',
      paymentMethod: data.paymentMethod || 'card',
      createdAt: new Date().toISOString(),
      budgetAlerts: [],
    };

    const txns = userTransactions.get(userId) || [];
    txns.unshift(txn);
    userTransactions.set(userId, txns);
    await persistToBlob();
    return txn;
  }

  static async getTransactionById(userId, txnId) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const txn = txns.find((t) => t.id === txnId);
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }
    return txn;
  }

  static async updateTransaction(userId, txnId, data) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const txn = txns.find((t) => t.id === txnId);
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }
    if (data.amount !== undefined) {
      txn.amount = Number(data.amount);
      txn.amountMinor = Math.round(Number(data.amount) * 100);
    }
    if (data.type) txn.type = data.type;
    if (data.note !== undefined) txn.note = data.note;
    if (data.date) txn.date = new Date(data.date).toISOString();
    if (data.paymentMethod) txn.paymentMethod = data.paymentMethod;
    await persistToBlob();
    return txn;
  }

  static async deleteTransaction(userId, txnId) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const idx = txns.findIndex((t) => t.id === txnId);
    if (idx === -1) {
      throw ApiError.notFound('Transaction not found');
    }
    txns.splice(idx, 1);
    await persistToBlob();
    return { id: txnId, message: 'Transaction deleted' };
  }

  // --- BUDGETS ---
  static async listBudgets(userId, month) {
    await syncFromBlob();
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, m] = targetMonth.split('-').map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

    const userBudgetList = userBudgets.get(userId) || [];
    const monthBudgets = userBudgetList.filter((b) => b.month === targetMonth);

    const txns = userTransactions.get(userId) || [];
    const monthTxns = txns.filter((t) => {
      const d = new Date(t.date);
      return t.type === 'expense' && d >= start && d <= end;
    });

    return monthBudgets.map((b) => {
      let spent = 0;
      if (b.category) {
        spent = monthTxns
          .filter((t) => (t.category?.id || t.category) === (b.category?.id || b.category))
          .reduce((acc, curr) => acc + curr.amount, 0);
      } else {
        spent = monthTxns.reduce((acc, curr) => acc + curr.amount, 0);
      }

      const remaining = Math.max(0, b.limit - spent);
      const percent = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      let status = 'ok';
      if (percent >= 100) status = 'exceeded';
      else if (percent >= 80) status = 'warning';

      return {
        id: b.id,
        month: targetMonth,
        category: b.category,
        limit: b.limit,
        spent: Number(spent.toFixed(2)),
        remaining: Number(remaining.toFixed(2)),
        percent,
        status,
      };
    });
  }

  static async upsertBudget(userId, data) {
    await syncFromBlob();
    const list = userBudgets.get(userId) || [];
    const cats = userCategories.get(userId) || [];
    const categoryDoc = data.category ? cats.find((c) => c.id === data.category) : null;

    const existingIdx = list.findIndex(
      (b) => b.month === data.month && (b.category?.id || b.category) === data.category
    );

    const budgetItem = {
      id: existingIdx !== -1 ? list[existingIdx].id : `budget_${Date.now()}`,
      user: userId,
      userId,
      month: data.month,
      category: categoryDoc || null,
      limit: Number(data.limit),
    };

    if (existingIdx !== -1) {
      list[existingIdx] = budgetItem;
    } else {
      list.push(budgetItem);
    }
    userBudgets.set(userId, list);
    await persistToBlob();
    return budgetItem;
  }

  static async deleteBudget(userId, budgetId) {
    await syncFromBlob();
    const list = userBudgets.get(userId) || [];
    const idx = list.findIndex((b) => b.id === budgetId);
    if (idx !== -1) {
      list.splice(idx, 1);
      await persistToBlob();
    }
    return { id: budgetId, message: 'Budget deleted successfully' };
  }

  // --- STATS ---
  static async getSummary(userId, from, to) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const now = new Date();
    let fromDate;
    let toDate;

    if (from && String(from).trim() !== '') {
      const parsed = new Date(from);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(0, 0, 0, 0);
        fromDate = parsed;
      }
    }
    if (to && String(to).trim() !== '') {
      const parsed = new Date(to);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(23, 59, 59, 999);
        toDate = parsed;
      }
    }
    if (!fromDate) fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    if (!toDate) toDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const currentTxns = txns.filter((t) => {
      const d = new Date(t.date);
      return d >= fromDate && d <= toDate;
    });

    let income = 0;
    let expense = 0;
    for (const t of currentTxns) {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    }

    const balance = Number((income - expense).toFixed(2));
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    return {
      income,
      expense,
      balance,
      savingsRate,
      count: currentTxns.length,
      previous: {
        income: 0,
        expense: 0,
        balance: 0,
      },
      changePct: {
        income: 0,
        expense: 0,
        balance: 0,
      },
    };
  }

  static async getByCategory(userId, from, to, type = 'expense') {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const now = new Date();
    let fromDate;
    let toDate;

    if (from && String(from).trim() !== '') {
      const parsed = new Date(from);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(0, 0, 0, 0);
        fromDate = parsed;
      }
    }
    if (to && String(to).trim() !== '') {
      const parsed = new Date(to);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(23, 59, 59, 999);
        toDate = parsed;
      }
    }
    if (!fromDate) fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    if (!toDate) toDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const filtered = txns.filter((t) => {
      const d = new Date(t.date);
      return t.type === type && d >= fromDate && d <= toDate;
    });

    const catMap = new Map();
    let grandTotal = 0;

    for (const t of filtered) {
      const cat = t.category || { id: 'other', name: 'Other', color: '#94A3B8' };
      const current = catMap.get(cat.id) || {
        categoryId: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon || 'tag',
        total: 0,
        count: 0,
      };
      current.total += t.amount;
      current.count += 1;
      grandTotal += t.amount;
      catMap.set(cat.id, current);
    }

    return Array.from(catMap.values())
      .map((item) => ({
        ...item,
        total: Number(item.total.toFixed(2)),
        percent: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  static async getMonthly(userId, months = 6) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const now = new Date();
    const monthKeys = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      monthKeys.push(d.toISOString().slice(0, 7));
    }

    return monthKeys.map((m) => {
      const [year, mon] = m.split('-').map(Number);
      const start = new Date(Date.UTC(year, mon - 1, 1));
      const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));

      const monthTxns = txns.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });

      let income = 0;
      let expense = 0;
      for (const t of monthTxns) {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
      }

      return {
        month: m,
        income,
        expense,
        net: Number((income - expense).toFixed(2)),
      };
    });
  }

  static async getDaily(userId, from, to) {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const toDate = to ? new Date(to) : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    const dailyMap = new Map();
    const curr = new Date(fromDate);
    while (curr <= toDate) {
      const dateStr = curr.toISOString().slice(0, 10);
      dailyMap.set(dateStr, { date: dateStr, income: 0, expense: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    const filtered = txns.filter((t) => {
      const d = new Date(t.date);
      return d >= fromDate && d <= toDate;
    });

    for (const t of filtered) {
      const d = t.date.slice(0, 10);
      if (dailyMap.has(d)) {
        const entry = dailyMap.get(d);
        if (t.type === 'income') entry.income += t.amount;
        if (t.type === 'expense') entry.expense += t.amount;
      }
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getTopTransactions(userId, from, to, limit = 5, type = 'expense') {
    await syncFromBlob();
    const txns = userTransactions.get(userId) || [];
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const toDate = to ? new Date(to) : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    return txns
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === type && d >= fromDate && d <= toDate;
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }
}
