import { db, migrate } from './index.js';
import { itemsRepository } from '../items/items.repository.js';
import type { CreateItemInput } from '../items/items.schema.js';

// A few sample rows for local poking around. Run with `npm run seed`.
const SAMPLE_ITEMS: CreateItemInput[] = [
  { name: 'Espresso', description: 'Single shot', category: 'beverage', price: 2.5, currency: 'USD' },
  { name: 'Cappuccino', description: 'With steamed milk', category: 'beverage', price: 3.75, currency: 'USD' },
  { name: 'Blueberry Muffin', category: 'bakery', price: 2.95, currency: 'USD' },
  { name: 'Ceramic Mug', description: '350ml, dishwasher safe', category: 'merchandise', price: 12.0, currency: 'USD' },
  { name: 'Bag of Beans', description: '250g single-origin', category: 'merchandise', price: 15.5, currency: 'EUR' },
];

migrate();

// wipe first so re-running gives the same result every time
db.exec('DELETE FROM items');

for (const item of SAMPLE_ITEMS) {
  itemsRepository.create(item);
}

const { total } = itemsRepository.list({ sortBy: 'createdAt', order: 'desc', limit: 1, offset: 0 });
console.log(`Seeded database. Total items: ${total}`);
