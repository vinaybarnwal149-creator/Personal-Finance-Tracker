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

describe('Authentication API', () => {
  const validUser = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'Password123',
    currency: 'USD',
  };

  it('registers a new user and sets refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.accessToken).toBeDefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/refreshToken=/);
  });

  it('prevents duplicate registration with the same email', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in an existing user with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns generic error on invalid credentials (no user enumeration)', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPassword99' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rotates refresh token on /auth/refresh and revokes on reuse', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const cookie = regRes.headers['set-cookie'][0];

    // First refresh: successful rotation
    const refresh1 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie);

    expect(refresh1.status).toBe(200);
    expect(refresh1.body.data.accessToken).toBeDefined();

    // Reuse detection: using the old revoked cookie must trigger theft protection
    const reuseAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie);

    expect(reuseAttempt.status).toBe(401);
    expect(reuseAttempt.body.error.code).toBe('REFRESH_INVALID');
  });

  it('rejects /auth/me when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
