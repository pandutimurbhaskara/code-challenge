import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

function createConnection() {
  // sqlite won't create the parent dir on its own
  if (config.databasePath !== ':memory:') {
    mkdirSync(dirname(config.databasePath), { recursive: true });
  }

  const connection = new Database(config.databasePath);
  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');
  return connection;
}

export const db = createConnection();

// Runs on every boot. Money lives in price_cents (integer) to dodge float math;
// the API layer converts to/from a decimal price.
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      category    TEXT,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      currency    TEXT    NOT NULL DEFAULT 'USD',
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_items_name     ON items (name);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
    CREATE INDEX IF NOT EXISTS idx_items_price    ON items (price_cents);
  `);
}
