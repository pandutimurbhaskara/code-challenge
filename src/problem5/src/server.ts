import { createApp } from './app.js';
import { config } from './config.js';
import { migrate } from './db/index.js';

// ensure the table exists before the server starts taking requests
migrate();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(
    `Items Price API listening on http://localhost:${config.port} (${config.nodeEnv})`,
  );
});

// close cleanly on Ctrl-C / kill
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  });
}
