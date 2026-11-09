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

describe('Transactions API & Data Isolation', () => {
  let tokenA;
  let tokenB;
  let expenseCategoryA;
  let incomeCategoryA;
  let categoryB;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123',
    });
    tokenA = resA.body.data.accessToken;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123',
    });
    tokenB = resB.body.data.accessToken;

    // Get categories for A
    const catsA = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenA}`);
    expenseCategoryA = catsA.body.data.find((c) => c.type === 'expense').id;
    incomeCategoryA = catsA.body.data.find((c) => c.type === 'income').id;

    // Get categories for B
    const catsB = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenB}`);
    categoryB = catsB.body.data[0].id;
  });

  it('creates an expense transaction successfully', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 45.5,
        category: expenseCategoryA,
        date: '2025-05-10',
        note: 'Team lunch',
        paymentMethod: 'card',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(45.5);
    expect(res.body.data.category.id).toBe(expenseCategoryA);
  });

  it('enforces category type matching (rejects income txn with expense category)', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'income',
        amount: 100,
        category: expenseCategoryA, // mismatch
        date: '2025-05-10',
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE');
  });

  it('enforces strict cross-user isolation: User B cannot access User A transaction (AC-3 / FR-TXN-07 -> 404)', async () => {
    // User A creates a transaction
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 88,
        category: expenseCategoryA,
        date: '2025-05-10',
      });

    const txnId = createRes.body.data.id;

    // User B attempts to read User A's transaction
    const getRes = await request(app)
      .get(`/api/v1/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(getRes.status).toBe(404);

    // User B attempts to edit User A's transaction
    const patchRes = await request(app)
      .patch(`/api/v1/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 99 });
    expect(patchRes.status).toBe(404);

    // User B attempts to delete User A's transaction
    const delRes = await request(app)
      .delete(`/api/v1/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(delRes.status).toBe(404);
  });

  it('lists transactions with totals and pagination', async () => {
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'income',
        amount: 1000,
        category: incomeCategoryA,
        date: '2025-05-01',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 300,
        category: expenseCategoryA,
        date: '2025-05-02',
      });

    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.totals.income).toBe(1000);
    expect(res.body.meta.totals.expense).toBe(300);
    expect(res.body.meta.totals.net).toBe(700);
  });
});
