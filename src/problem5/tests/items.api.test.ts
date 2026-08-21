import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { migrateDb, resetDb } from './helpers.js';

// End-to-end HTTP tests against the real Express app (no port bound), backed by
// an in-memory DB. These cover routing, validation, status codes and the
// response envelopes — the full request lifecycle a client actually sees.

let app: Express;

beforeAll(() => {
  migrateDb();
  app = createApp();
});
beforeEach(() => resetDb());

// Convenience: create an item straight through the API and return its body.
async function seedItem(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/items')
    .send({ name: 'Espresso', category: 'beverage', price: 2.5, currency: 'USD', ...overrides });
  return res.body.data;
}

describe('meta endpoints', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET / lists the endpoints and docs links', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.docs).toBe('GET /docs');
    expect(res.body.endpoints.create).toBe('POST /api/items');
  });

  it('GET /openapi.json serves a valid OpenAPI document', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/api/items']).toBeDefined();
  });

  it('unknown routes return a 404 envelope', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('not found');
  });
});

describe('POST /api/items', () => {
  it('creates an item and returns 201 with the data envelope', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Espresso', description: 'Single shot', category: 'beverage', price: 2.5, currency: 'usd' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: 1,
      name: 'Espresso',
      price: 2.5,
      currency: 'USD', // upper-cased
    });
    expect(res.body.data.createdAt).toBeTypeOf('string');
  });

  it('defaults currency to USD', async () => {
    const res = await request(app).post('/api/items').send({ name: 'Muffin', price: 2.95 });
    expect(res.status).toBe(201);
    expect(res.body.data.currency).toBe('USD');
  });

  it('rejects a negative price with 400 and field details', async () => {
    const res = await request(app).post('/api/items').send({ name: 'x', price: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details.fieldErrors.price).toContain('price cannot be negative');
  });

  it('rejects a missing name with 400', async () => {
    const res = await request(app).post('/api/items').send({ price: 1 });
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Content-Type', 'application/json')
      .send('{ this is not json ');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid JSON in request body');
  });
});

describe('GET /api/items', () => {
  beforeEach(async () => {
    await seedItem({ name: 'Espresso', category: 'beverage', price: 2.5 });
    await seedItem({ name: 'Cappuccino', category: 'beverage', price: 3.75 });
    await seedItem({ name: 'Ceramic Mug', category: 'merchandise', price: 12 });
  });

  it('lists items with pagination metadata', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination).toEqual({ total: 3, limit: 20, offset: 0, count: 3 });
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/items').query({ category: 'beverage' });
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.data.every((i: { category: string }) => i.category === 'beverage')).toBe(true);
  });

  it('filters by price range and sorts by price asc', async () => {
    const res = await request(app)
      .get('/api/items')
      .query({ minPrice: 3, maxPrice: 12, sortBy: 'price', order: 'asc' });
    expect(res.body.data.map((i: { price: number }) => i.price)).toEqual([3.75, 12]);
  });

  it('rejects minPrice greater than maxPrice with 400', async () => {
    const res = await request(app).get('/api/items').query({ minPrice: 10, maxPrice: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('minPrice cannot be greater than maxPrice');
  });

  it('rejects an out-of-range limit with 400', async () => {
    const res = await request(app).get('/api/items').query({ limit: 500 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/items/:id', () => {
  it('returns the item when it exists', async () => {
    const created = await seedItem();
    const res = await request(app).get(`/api/items/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.id);
  });

  it('returns 404 for a missing item', async () => {
    const res = await request(app).get('/api/items/999');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Item 999 not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/api/items/abc');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/items/:id (replace)', () => {
  it('replaces the whole item and clears omitted optionals', async () => {
    const created = await seedItem({ description: 'Single shot', category: 'beverage' });

    const res = await request(app)
      .put(`/api/items/${created.id}`)
      .send({ name: 'Tea', price: 1.5, currency: 'GBP' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: 'Tea',
      description: null,
      category: null,
      price: 1.5,
      currency: 'GBP',
    });
  });

  it('returns 400 when a required field is missing', async () => {
    const created = await seedItem();
    const res = await request(app).put(`/api/items/${created.id}`).send({ name: 'Tea' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing item', async () => {
    const res = await request(app).put('/api/items/999').send({ name: 'Tea', price: 1 });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/items/:id (partial update)', () => {
  it('updates only the provided fields', async () => {
    const created = await seedItem({ description: 'Single shot' });
    const res = await request(app).patch(`/api/items/${created.id}`).send({ price: 9.99 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(9.99);
    expect(res.body.data.description).toBe('Single shot'); // untouched
  });

  it('clears a field when null is sent', async () => {
    const created = await seedItem({ category: 'beverage' });
    const res = await request(app).patch(`/api/items/${created.id}`).send({ category: null });
    expect(res.body.data.category).toBeNull();
  });

  it('returns 400 for an empty body', async () => {
    const created = await seedItem();
    const res = await request(app).patch(`/api/items/${created.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing item', async () => {
    const res = await request(app).patch('/api/items/999').send({ price: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/items/:id', () => {
  it('deletes an existing item and returns 204', async () => {
    const created = await seedItem();
    const res = await request(app).delete(`/api/items/${created.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    // and it's really gone
    const after = await request(app).get(`/api/items/${created.id}`);
    expect(after.status).toBe(404);
  });

  it('returns 404 when deleting a missing item', async () => {
    const res = await request(app).delete('/api/items/999');
    expect(res.status).toBe(404);
  });
});
