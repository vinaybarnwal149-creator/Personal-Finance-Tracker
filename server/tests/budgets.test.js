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

describe('Budgets API & Alerts', () => {
  let token;
  let expenseCat;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'Password123',
    });
    token = res.body.data.accessToken;

    const cats = await request(app)
      .get('/api/v1/categories?type=expense')
      .set('Authorization', `Bearer ${token}`);
    expenseCat = cats.body.data[0];
  });

  it('upserts a category budget and triggers warning alert on crossing 80%', async () => {
    // Set budget: $100
    const budgetRes = await request(app)
      .put('/api/v1/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: '2025-06',
        category: expenseCat.id,
        limit: 100,
      });

    expect(budgetRes.status).toBe(200);
    expect(budgetRes.body.data.limit).toBe(100);

    // Add expense: $85 (85% of budget)
    const txnRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 85,
        category: expenseCat.id,
        date: '2025-06-15',
      });

    expect(txnRes.status).toBe(201);
    expect(txnRes.body.data.budgetAlerts.length).toBeGreaterThanOrEqual(1);
    expect(txnRes.body.data.budgetAlerts[0].status).toBe('warning');
    expect(txnRes.body.data.budgetAlerts[0].percent).toBe(85);
  });

  it('calculates progress correctly for budgets', async () => {
    await request(app)
      .put('/api/v1/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: '2025-06',
        category: expenseCat.id,
        limit: 200,
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 50,
        category: expenseCat.id,
        date: '2025-06-10',
      });

    const res = await request(app)
      .get('/api/v1/budgets?month=2025-06')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const item = res.body.data.find((b) => b.category?.id === expenseCat.id);
    expect(item).toBeDefined();
    expect(item.limit).toBe(200);
    expect(item.spent).toBe(50);
    expect(item.remaining).toBe(150);
    expect(item.percent).toBe(25);
    expect(item.status).toBe('ok');
  });

  it('copies budgets from previous month', async () => {
    await request(app)
      .put('/api/v1/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: '2025-06',
        category: expenseCat.id,
        limit: 300,
      });

    const copyRes = await request(app)
      .post('/api/v1/budgets/copy')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fromMonth: '2025-06',
        toMonth: '2025-07',
      });

    expect(copyRes.status).toBe(200);
    expect(copyRes.body.data.copiedCount).toBe(1);

    const listRes = await request(app)
      .get('/api/v1/budgets?month=2025-07')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.length).toBe(1);
  });
});
