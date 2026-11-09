import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';

beforeAll(async () => {
  await setupTestDB();
}, 60000);

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('User Isolation and Brand-New User Empty States', () => {
  it('FR-DATA-01: Brand-new user starts with ZERO transactions, ZERO budgets, and ZERO summary stats', async () => {
    // 1. Register brand new user
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Empty State User',
        email: 'emptystate_user@test.com',
        password: 'Password123',
        currency: 'USD',
      })
      .expect(201);

    const token = res.body.data.accessToken;
    expect(token).toBeDefined();

    // 2. Assert GET /transactions returns empty list & zero totals
    const txnRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(txnRes.body.success).toBe(true);
    expect(txnRes.body.data).toEqual([]);
    expect(txnRes.body.meta.total).toBe(0);
    expect(txnRes.body.meta.totals.income).toBe(0);
    expect(txnRes.body.meta.totals.expense).toBe(0);
    expect(txnRes.body.meta.totals.net).toBe(0);

    // 3. Assert GET /budgets returns empty list
    const budRes = await request(app)
      .get('/api/v1/budgets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(budRes.body.success).toBe(true);
    expect(budRes.body.data).toEqual([]);

    // 4. Assert GET /stats/summary returns zeros
    const statsRes = await request(app)
      .get('/api/v1/stats/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.income).toBe(0);
    expect(statsRes.body.data.expense).toBe(0);
    expect(statsRes.body.data.balance).toBe(0);
    expect(statsRes.body.data.count).toBe(0);

    // 5. Assert default categories were seeded
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(catRes.body.success).toBe(true);
    expect(catRes.body.data.length).toBeGreaterThan(0);
  });

  it('FR-DATA-02: User A transactions are strictly isolated and NEVER visible to User B', async () => {
    // 1. Register User A
    const userARes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User A',
        email: 'user_a_isolation@test.com',
        password: 'Password123',
        currency: 'USD',
      })
      .expect(201);
    const tokenA = userARes.body.data.accessToken;

    // Get an expense category for User A
    const catARes = await request(app)
      .get('/api/v1/categories?type=expense')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const categoryA = catARes.body.data[0];

    // User A creates an expense transaction
    const txnCreateRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 85.5,
        category: categoryA.id || categoryA._id,
        date: new Date().toISOString(),
        note: 'Secret expense of User A',
      })
      .expect(201);

    const userATxnId = txnCreateRes.body.data.id || txnCreateRes.body.data._id;
    expect(userATxnId).toBeDefined();

    // 2. Register User B
    const userBRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User B',
        email: 'user_b_isolation@test.com',
        password: 'Password123',
        currency: 'USD',
      })
      .expect(201);
    const tokenB = userBRes.body.data.accessToken;

    // 3. User B calls GET /transactions -> must be EMPTY
    const userBTxns = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(userBTxns.body.data).toEqual([]);
    expect(userBTxns.body.meta.total).toBe(0);

    // 4. User B attempts to access User A's transaction directly by ID -> returns 404
    await request(app)
      .get(`/api/v1/transactions/${userATxnId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // 5. User B attempts to delete User A's transaction -> returns 404
    await request(app)
      .delete(`/api/v1/transactions/${userATxnId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // 6. User A's transaction is still intact
    const userAVerify = await request(app)
      .get(`/api/v1/transactions/${userATxnId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(userAVerify.body.data.note).toBe('Secret expense of User A');
  });

  it('FR-DATA-03: Newly created income and expense dated today appear in transactions list, monthly summary, and monthly chart', async () => {
    // 1. Register a fresh user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sync Test User',
        email: `synctest_${Date.now()}@test.com`,
        password: 'Password123',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      })
      .expect(201);
    const token = regRes.body.data.accessToken;

    // 2. Fetch categories
    const [incCatRes, expCatRes] = await Promise.all([
      request(app).get('/api/v1/categories?type=income').set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get('/api/v1/categories?type=expense').set('Authorization', `Bearer ${token}`).expect(200),
    ]);
    const incCat = incCatRes.body.data[0];
    const expCat = expCatRes.body.data[0];

    // 3. Create one income and one expense dated today
    const today = new Date().toISOString().slice(0, 10);
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 50000,
        category: incCat.id || incCat._id,
        date: today,
        paymentMethod: 'bank_transfer',
        note: 'Freelance design project',
      })
      .expect(201);

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 15000,
        category: expCat.id || expCat._id,
        date: today,
        paymentMethod: 'card',
        note: 'Office rent',
      })
      .expect(201);

    // 4. Assert GET /transactions (even with empty filter params) returns both with correct totals
    const listRes = await request(app)
      .get('/api/v1/transactions?limit=20&type=&category=&q=&from=&to=&sort=-date')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(2);
    expect(listRes.body.meta.total).toBe(2);
    expect(listRes.body.meta.totals.income).toBe(50000);
    expect(listRes.body.meta.totals.expense).toBe(15000);
    expect(listRes.body.meta.totals.net).toBe(35000);

    // 5. Assert GET /stats/summary for "This Month" returns matching totals and balance
    const summaryRes = await request(app)
      .get('/api/v1/stats/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(summaryRes.body.success).toBe(true);
    expect(summaryRes.body.data.income).toBe(50000);
    expect(summaryRes.body.data.expense).toBe(15000);
    expect(summaryRes.body.data.balance).toBe(35000);
    expect(summaryRes.body.data.count).toBe(2);

    // 6. Assert GET /stats/monthly chart matches
    const monthlyRes = await request(app)
      .get('/api/v1/stats/monthly?months=6')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(monthlyRes.body.success).toBe(true);
    const currentMonthKey = today.slice(0, 7);
    const monthEntry = monthlyRes.body.data.find((m) => m.month === currentMonthKey);
    expect(monthEntry).toBeDefined();
    expect(monthEntry.income).toBe(50000);
    expect(monthEntry.expense).toBe(15000);
    expect(monthEntry.net).toBe(35000);
  });
});

