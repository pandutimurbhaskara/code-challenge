import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // tests/setup.ts pins an in-memory DB *before* any app module is imported.
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // Each test file runs in its own worker → its own fresh in-memory DB.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/db/seed.ts', 'src/docs/**'],
    },
  },
});
