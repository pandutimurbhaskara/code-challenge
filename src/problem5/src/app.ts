import express from 'express';
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import itemsRouter from './items/items.routes.js';
import { openApiDocument } from './docs/openapi.js';

// Split out from server.ts so tests can build the app without binding a port.
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // handy entry point that lists what's available
  app.get('/', (_req, res) => {
    res.json({
      name: 'Items Price API',
      version: '1.0.0',
      docs: 'GET /docs',
      openapi: 'GET /openapi.json',
      endpoints: {
        health: 'GET /health',
        create: 'POST /api/items',
        list: 'GET /api/items',
        read: 'GET /api/items/:id',
        replace: 'PUT /api/items/:id',
        update: 'PATCH /api/items/:id',
        delete: 'DELETE /api/items/:id',
      },
    });
  });

  // Interactive API docs (Swagger UI) + the raw spec, so the schema can be
  // fed to Postman, codegen, etc.
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Items Price API — docs',
  }));

  app.use('/api/items', itemsRouter);

  // these two have to come last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
