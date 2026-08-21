import { describe, it, expect } from 'vitest';
import {
  createItemSchema,
  updateItemSchema,
  listItemsQuerySchema,
  idParamSchema,
} from '../src/items/items.schema.js';

// Pure unit tests for the zod validation layer — no database, no HTTP.
// These lock down the contract the controller relies on.

describe('createItemSchema', () => {
  it('accepts a full, valid payload and upper-cases the currency', () => {
    const parsed = createItemSchema.parse({
      name: 'Espresso',
      description: 'Single shot',
      category: 'beverage',
      price: 2.5,
      currency: 'usd',
    });
    expect(parsed).toEqual({
      name: 'Espresso',
      description: 'Single shot',
      category: 'beverage',
      price: 2.5,
      currency: 'USD',
    });
  });

  it('defaults currency to USD when omitted', () => {
    const parsed = createItemSchema.parse({ name: 'Muffin', price: 2.95 });
    expect(parsed.currency).toBe('USD');
  });

  it('trims whitespace on name', () => {
    const parsed = createItemSchema.parse({ name: '  Latte  ', price: 4 });
    expect(parsed.name).toBe('Latte');
  });

  it('rejects an empty name', () => {
    const result = createItemSchema.safeParse({ name: '   ', price: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing price', () => {
    const result = createItemSchema.safeParse({ name: 'No price' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative price with a helpful message', () => {
    const result = createItemSchema.safeParse({ name: 'x', price: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.price).toContain('price cannot be negative');
    }
  });

  it('rejects a non-numeric price', () => {
    const result = createItemSchema.safeParse({ name: 'x', price: '2.5' });
    expect(result.success).toBe(false);
  });

  it('rejects a currency that is not 3 letters', () => {
    const result = createItemSchema.safeParse({ name: 'x', price: 1, currency: 'DOLLAR' });
    expect(result.success).toBe(false);
  });
});

describe('updateItemSchema', () => {
  it('accepts a single field', () => {
    const parsed = updateItemSchema.parse({ price: 9.99 });
    expect(parsed).toEqual({ price: 9.99 });
  });

  it('accepts null to clear description and category', () => {
    const parsed = updateItemSchema.parse({ description: null, category: null });
    expect(parsed).toEqual({ description: null, category: null });
  });

  it('rejects an empty object (at least one field required)', () => {
    const result = updateItemSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('At least one field must be provided');
    }
  });

  it('rejects null on price (not clearable)', () => {
    const result = updateItemSchema.safeParse({ price: null });
    expect(result.success).toBe(false);
  });
});

describe('listItemsQuerySchema', () => {
  it('applies defaults when nothing is provided', () => {
    const parsed = listItemsQuerySchema.parse({});
    expect(parsed).toMatchObject({
      sortBy: 'createdAt',
      order: 'desc',
      limit: 20,
      offset: 0,
    });
  });

  it('coerces numeric strings from the query string', () => {
    const parsed = listItemsQuerySchema.parse({
      minPrice: '2.5',
      maxPrice: '10',
      limit: '5',
      offset: '10',
    });
    expect(parsed.minPrice).toBe(2.5);
    expect(parsed.maxPrice).toBe(10);
    expect(parsed.limit).toBe(5);
    expect(parsed.offset).toBe(10);
  });

  it('rejects limit above 100', () => {
    expect(listItemsQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('rejects limit below 1', () => {
    expect(listItemsQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
  });

  it('rejects an unknown sortBy value', () => {
    expect(listItemsQuerySchema.safeParse({ sortBy: 'color' }).success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('coerces a numeric string id', () => {
    expect(idParamSchema.parse({ id: '42' })).toEqual({ id: 42 });
  });

  it('rejects a non-numeric id', () => {
    expect(idParamSchema.safeParse({ id: 'abc' }).success).toBe(false);
  });

  it('rejects a zero or negative id', () => {
    expect(idParamSchema.safeParse({ id: '0' }).success).toBe(false);
    expect(idParamSchema.safeParse({ id: '-3' }).success).toBe(false);
  });
});
