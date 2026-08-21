import { db } from '../db/index.js';
import type {
  CreateItemInput,
  ListItemsQuery,
  ReplaceItemInput,
  UpdateItemInput,
} from './items.schema.js';

// what actually comes back from sqlite (snake_case, price in cents)
interface ItemRow {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// what callers get back (camelCase, price as a decimal)
export interface Item {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

const toCents = (price: number): number => Math.round(price * 100);

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price_cents / 100,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// sortBy comes from the query string, so map it through a fixed list rather
// than interpolating it straight into the SQL
const SORT_COLUMNS: Record<ListItemsQuery['sortBy'], string> = {
  name: 'name',
  price: 'price_cents',
  createdAt: 'created_at',
};

export const itemsRepository = {
  create(input: CreateItemInput): Item {
    const info = db
      .prepare(
        `INSERT INTO items (name, description, category, price_cents, currency)
         VALUES (@name, @description, @category, @price_cents, @currency)`,
      )
      .run({
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        price_cents: toCents(input.price),
        currency: input.currency,
      });

    return this.findById(Number(info.lastInsertRowid))!;
  },

  findById(id: number): Item | undefined {
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as
      | ItemRow
      | undefined;
    return row ? rowToItem(row) : undefined;
  },

  list(query: ListItemsQuery): { items: Item[]; total: number } {
    const conditions: string[] = [];
    const filters: Record<string, unknown> = {};

    if (query.q !== undefined) {
      conditions.push('name LIKE @q');
      filters.q = `%${query.q}%`;
    }
    if (query.category !== undefined) {
      conditions.push('category = @category');
      filters.category = query.category;
    }
    if (query.currency !== undefined) {
      conditions.push('currency = @currency');
      filters.currency = query.currency;
    }
    if (query.minPrice !== undefined) {
      conditions.push('price_cents >= @minPrice');
      filters.minPrice = toCents(query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      conditions.push('price_cents <= @maxPrice');
      filters.maxPrice = toCents(query.maxPrice);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const column = SORT_COLUMNS[query.sortBy];
    const direction = query.order === 'asc' ? 'ASC' : 'DESC';

    const { total } = db
      .prepare(`SELECT COUNT(*) AS total FROM items ${where}`)
      .get(filters) as { total: number };

    const rows = db
      .prepare(
        `SELECT * FROM items ${where}
         ORDER BY ${column} ${direction}, id ${direction}
         LIMIT @limit OFFSET @offset`,
      )
      .all({ ...filters, limit: query.limit, offset: query.offset }) as ItemRow[];

    return { items: rows.map(rowToItem), total };
  },

  // full overwrite; undefined if the row isn't there
  replace(id: number, input: ReplaceItemInput): Item | undefined {
    const result = db
      .prepare(
        `UPDATE items
            SET name = @name,
                description = @description,
                category = @category,
                price_cents = @price_cents,
                currency = @currency,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = @id`,
      )
      .run({
        id,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        price_cents: toCents(input.price),
        currency: input.currency,
      });

    return result.changes > 0 ? this.findById(id) : undefined;
  },

  // patch only the fields that were sent; undefined if the row isn't there
  update(id: number, input: UpdateItemInput): Item | undefined {
    const assignments: string[] = [];
    const params: Record<string, unknown> = { id };

    if (input.name !== undefined) {
      assignments.push('name = @name');
      params.name = input.name;
    }
    if (input.description !== undefined) {
      assignments.push('description = @description');
      params.description = input.description; // null clears it
    }
    if (input.category !== undefined) {
      assignments.push('category = @category');
      params.category = input.category; // null clears it
    }
    if (input.price !== undefined) {
      assignments.push('price_cents = @price_cents');
      params.price_cents = toCents(input.price);
    }
    if (input.currency !== undefined) {
      assignments.push('currency = @currency');
      params.currency = input.currency;
    }
    assignments.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");

    const result = db
      .prepare(`UPDATE items SET ${assignments.join(', ')} WHERE id = @id`)
      .run(params);

    return result.changes > 0 ? this.findById(id) : undefined;
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
