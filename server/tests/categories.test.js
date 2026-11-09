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

describe('Categories API', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Cat Tester',
      email: 'cattester@example.com',
      password: 'Password123',
    });
    token = res.body.data.accessToken;
  });

  it('automatically seeds default categories upon registration', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(12);
  });

  it('creates custom category and blocks duplicate name in same type', async () => {
    const res1 = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Photography',
        type: 'expense',
        color: '#8B5CF6',
        icon: 'camera',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.name).toBe('Photography');

    const res2 = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'photography', // case-insensitive check
        type: 'expense',
      });

    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('DUPLICATE');
  });

  it('blocks deletion of category in use without reassignTo (409 CATEGORY_IN_USE)', async () => {
    const catsRes = await request(app)
      .get('/api/v1/categories?type=expense')
      .set('Authorization', `Bearer ${token}`);
    const cat1 = catsRes.body.data[0];

    // Create transaction in cat1
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 25,
        category: cat1.id,
        date: '2025-06-01',
      });

    // Attempt delete without reassignTo
    const delRes = await request(app)
      .delete(`/api/v1/categories/${cat1.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.code).toBe('CATEGORY_IN_USE');
    expect(delRes.body.error.details.count).toBe(1);
  });

  it('successfully deletes category in use when reassignTo is provided', async () => {
    const catsRes = await request(app)
      .get('/api/v1/categories?type=expense')
      .set('Authorization', `Bearer ${token}`);
    const cat1 = catsRes.body.data[0];
    const cat2 = catsRes.body.data[1];

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 25,
        category: cat1.id,
        date: '2025-06-01',
      });

    const delRes = await request(app)
      .delete(`/api/v1/categories/${cat1.id}?reassignTo=${cat2.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);

    // Verify transaction now has cat2
    const txnsRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(txnsRes.body.data[0].category.id).toBe(cat2.id);
  });
});
