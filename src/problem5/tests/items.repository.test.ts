import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { itemsRepository } from '../src/items/items.repository.js';
import { migrateDb, resetDb } from './helpers.js';

// Unit tests for the data-access layer against a real (in-memory) SQLite DB.
// These exercise the SQL, the cents<->decimal conversion, and filtering/sorting.

beforeAll(() => migrateDb());
beforeEach(() => resetDb());

const base = { name: 'Espresso', price: 2.5, currency: 'USD' } as const;

describe('create + findById', () => {
  it('inserts a row and returns it with a decimal price and timestamps', () => {
    const item = itemsRepository.create({
      name: 'Espresso',
      description: 'Single shot',
      category: 'beverage',
      price: 2.5,
      currency: 'USD',
    });

    expect(item.id).toBe(1);
    expect(item.price).toBe(2.5);
    expect(item.currency).toBe('USD');
    expect(item.createdAt).toBeTypeOf('string');
    expect(item.updatedAt).toBe(item.createdAt);

    const fetched = itemsRepository.findById(item.id);
    expect(fetched).toEqual(item);
  });

  it('stores price as integer cents (no float drift)', () => {
    // 19.99 * 100 in float is 1998.9999...; the repo rounds to 1999 cents.
    const item = itemsRepository.create({ ...base, name: 'Book', price: 19.99 });
    expect(item.price).toBe(19.99);
  });

  it('defaults description and category to null when omitted', () => {
    const item = itemsRepository.create(base);
    expect(item.description).toBeNull();
    expect(item.category).toBeNull();
  });

  it('returns undefined for a missing id', () => {
    expect(itemsRepository.findById(999)).toBeUndefined();
  });
});

describe('list', () => {
  beforeEach(() => {
    itemsRepository.create({ name: 'Espresso', category: 'beverage', price: 2.5, currency: 'USD' });
    itemsRepository.create({ name: 'Cappuccino', category: 'beverage', price: 3.75, currency: 'USD' });
    itemsRepository.create({ name: 'Ceramic Mug', category: 'merchandise', price: 12, currency: 'USD' });
    itemsRepository.create({ name: 'Bag of Beans', category: 'merchandise', price: 15.5, currency: 'EUR' });
  });

  const defaults = { sortBy: 'createdAt', order: 'desc', limit: 20, offset: 0 } as const;

  it('returns all rows with a total', () => {
    const { items, total } = itemsRepository.list({ ...defaults });
    expect(total).toBe(4);
    expect(items).toHaveLength(4);
  });

  it('filters by exact category', () => {
    const { items, total } = itemsRepository.list({ ...defaults, category: 'beverage' });
    expect(total).toBe(2);
    expect(items.map((i) => i.name).sort()).toEqual(['Cappuccino', 'Espresso']);
  });

  it('filters by partial name match (q)', () => {
    const { items } = itemsRepository.list({ ...defaults, q: 'app' });
    expect(items.map((i) => i.name)).toEqual(['Cappuccino']);
  });

  it('filters by currency', () => {
    const { items } = itemsRepository.list({ ...defaults, currency: 'EUR' });
    expect(items.map((i) => i.name)).toEqual(['Bag of Beans']);
  });

  it('filters by price range (inclusive)', () => {
    const { items } = itemsRepository.list({ ...defaults, minPrice: 3, maxPrice: 12 });
    expect(items.map((i) => i.name).sort()).toEqual(['Cappuccino', 'Ceramic Mug']);
  });

  it('sorts by price ascending', () => {
    const { items } = itemsRepository.list({ ...defaults, sortBy: 'price', order: 'asc' });
    expect(items.map((i) => i.price)).toEqual([2.5, 3.75, 12, 15.5]);
  });

  it('paginates with limit and offset', () => {
    const page = itemsRepository.list({ ...defaults, sortBy: 'price', order: 'asc', limit: 2, offset: 2 });
    expect(page.total).toBe(4); // total ignores the page window
    expect(page.items.map((i) => i.price)).toEqual([12, 15.5]);
  });
});

describe('replace', () => {
  it('overwrites every field and clears omitted optionals', () => {
    const created = itemsRepository.create({
      name: 'Espresso',
      description: 'Single shot',
      category: 'beverage',
      price: 2.5,
      currency: 'USD',
    });

    const replaced = itemsRepository.replace(created.id, {
      name: 'Tea',
      price: 1.5,
      currency: 'GBP',
    });

    expect(replaced).toMatchObject({
      id: created.id,
      name: 'Tea',
      description: null, // was 'Single shot', now cleared
      category: null, // was 'beverage', now cleared
      price: 1.5,
      currency: 'GBP',
    });
  });

  it('returns undefined when the row does not exist', () => {
    expect(itemsRepository.replace(999, { ...base })).toBeUndefined();
  });
});

describe('update (partial)', () => {
  it('changes only the provided fields', () => {
    const created = itemsRepository.create({
      name: 'Espresso',
      description: 'Single shot',
      category: 'beverage',
      price: 2.5,
      currency: 'USD',
    });

    const updated = itemsRepository.update(created.id, { price: 9.99 });
    expect(updated).toMatchObject({
      name: 'Espresso', // unchanged
      description: 'Single shot', // unchanged
      price: 9.99, // changed
    });
  });

  it('clears description/category when passed null', () => {
    const created = itemsRepository.create({
      name: 'Espresso',
      description: 'Single shot',
      category: 'beverage',
      price: 2.5,
      currency: 'USD',
    });

    const updated = itemsRepository.update(created.id, { description: null, category: null });
    expect(updated?.description).toBeNull();
    expect(updated?.category).toBeNull();
  });

  it('returns undefined when the row does not exist', () => {
    expect(itemsRepository.update(999, { price: 1 })).toBeUndefined();
  });
});

describe('delete', () => {
  it('removes an existing row and reports success', () => {
    const created = itemsRepository.create(base);
    expect(itemsRepository.delete(created.id)).toBe(true);
    expect(itemsRepository.findById(created.id)).toBeUndefined();
  });

  it('reports false when the row does not exist', () => {
    expect(itemsRepository.delete(999)).toBe(false);
  });
});
