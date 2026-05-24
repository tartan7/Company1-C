import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app';

describe('lunch non-happy paths', () => {
  const app = buildApp();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 for invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lunch/orders',
      payload: { userId: '', itemId: '', quantity: -1 },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.correlationId).toBeDefined();
  });

  it('returns 503 for simulated DB outage', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lunch/orders',
      payload: { userId: 'u1', itemId: 'i1', quantity: 1, mode: 'dberror' },
    });

    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('DB_UNAVAILABLE');
  });

  it('returns 409 for DB conflict', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lunch/orders',
      payload: { userId: 'u1', itemId: 'i1', quantity: 1, mode: 'dbconflict' },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('DB_CONFLICT');
  });

  it('returns 500 for unhandled exception and keeps response contract', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lunch/orders',
      payload: { userId: 'u1', itemId: 'i1', quantity: 1, mode: 'panic' },
    });

    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.correlationId).toBeDefined();
  });

  it('exposes metrics endpoint', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('req_total');
  });
});
