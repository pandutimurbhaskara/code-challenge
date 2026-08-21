// Runs before each test file is imported (see vitest.config.ts `setupFiles`),
// which means it runs *before* config.ts / db/index.ts read these values.
//
// Forcing an in-memory SQLite database keeps the test suite hermetic: it never
// touches the real ./data/items.db file, needs no cleanup, and starts empty in
// every worker.
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
