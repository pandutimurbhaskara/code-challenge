import 'dotenv/config';

// Read env once at boot so the rest of the app just imports `config`.
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: process.env.DATABASE_PATH ?? './data/items.db',
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

export type Config = typeof config;
