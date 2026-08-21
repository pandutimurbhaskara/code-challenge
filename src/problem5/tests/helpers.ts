import { db, migrate } from '../src/db/index.js';

// Apply the schema to the (in-memory) database. Idempotent — safe to call once
// per test file in a beforeAll.
export function migrateDb(): void {
  migrate();
}

// Return the database to a known-empty state between tests, and reset the
// AUTOINCREMENT counter so ids are predictable (start at 1) in every test.
export function resetDb(): void {
  db.exec('DELETE FROM items');
  // sqlite_sequence exists because `items` has an AUTOINCREMENT column; the
  // WHERE guard keeps this harmless even if it hasn't been populated yet.
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'items'");
}
