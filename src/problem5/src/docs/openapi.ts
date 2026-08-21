// Hand-authored OpenAPI 3.0.3 document.
//
// It mirrors the zod schemas in `items/items.schema.ts` one-to-one (field types,
// bounds, defaults) and the response envelopes produced by the controller. Kept
// as a plain object (not JSON) so it can be imported directly and served by
// swagger-ui-express — see `app.ts`, mounted at `/docs`.
//
// If you change a schema in items.schema.ts, update the matching block here.

import { config } from '../config.js';

// A single reusable item example, referenced from several places below.
const itemExample = {
  id: 1,
  name: 'Espresso',
  description: 'Single shot',
  category: 'beverage',
  price: 2.5,
  currency: 'USD',
  createdAt: '2026-08-20T07:42:39.161Z',
  updatedAt: '2026-08-20T07:42:39.161Z',
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Items Price API',
    version: '1.0.0',
    description:
      'A small CRUD backend for managing the price of items, built with ' +
      'Express + TypeScript + SQLite.\n\n' +
      'Successful responses use a `{ "data": ... }` envelope; errors use ' +
      '`{ "error": { "message", "details?" } }`. Prices are exposed as decimals ' +
      'but stored internally as integer minor units to avoid floating-point drift.',
  },
  servers: [
    { url: `http://localhost:${config.port}`, description: 'Local development' },
  ],
  tags: [
    { name: 'Items', description: 'Create, read, update and delete priced items.' },
    { name: 'Meta', description: 'Health check and service metadata.' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Meta'],
        summary: 'Health check',
        operationId: 'health',
        responses: {
          '200': {
            description: 'Service is up.',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } },
                example: { status: 'ok' },
              },
            },
          },
        },
      },
    },

    '/api/items': {
      post: {
        tags: ['Items'],
        summary: 'Create an item',
        description:
          'Only `name` and `price` are required. `currency` defaults to `USD` and ' +
          'is upper-cased. `description` and `category` are optional.',
        operationId: 'createItem',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateItemInput' },
              examples: {
                full: {
                  summary: 'All fields',
                  value: {
                    name: 'Espresso',
                    description: 'Single shot',
                    category: 'beverage',
                    price: 2.5,
                    currency: 'usd',
                  },
                },
                minimal: {
                  summary: 'Required fields only (currency defaults to USD)',
                  value: { name: 'Blueberry Muffin', price: 2.95 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item created.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ItemEnvelope' },
                example: { data: itemExample },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
      get: {
        tags: ['Items'],
        summary: 'List items',
        description: 'Filter, sort and paginate. All query parameters are optional.',
        operationId: 'listItems',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Case-insensitive partial match on `name`.',
            required: false,
            schema: { type: 'string', minLength: 1 },
            example: 'esp',
          },
          {
            name: 'category',
            in: 'query',
            description: 'Exact category match.',
            required: false,
            schema: { type: 'string', maxLength: 100 },
            example: 'beverage',
          },
          {
            name: 'currency',
            in: 'query',
            description: 'Exact currency match (3-letter ISO code, upper-cased).',
            required: false,
            schema: { type: 'string', minLength: 3, maxLength: 3 },
            example: 'USD',
          },
          {
            name: 'minPrice',
            in: 'query',
            description: 'Minimum price, inclusive.',
            required: false,
            schema: { type: 'number', minimum: 0 },
            example: 2,
          },
          {
            name: 'maxPrice',
            in: 'query',
            description: 'Maximum price, inclusive. Must be >= minPrice.',
            required: false,
            schema: { type: 'number', minimum: 0 },
            example: 10,
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['name', 'price', 'createdAt'], default: 'createdAt' },
          },
          {
            name: 'order',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Page size.',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Rows to skip.',
            required: false,
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'A page of items.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ItemListEnvelope' },
                example: {
                  data: [itemExample],
                  pagination: { total: 3, limit: 20, offset: 0, count: 1 },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/api/items/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Numeric item id.',
          schema: { type: 'integer', minimum: 1 },
          example: 1,
        },
      ],
      get: {
        tags: ['Items'],
        summary: 'Get an item by id',
        operationId: 'getItem',
        responses: {
          '200': {
            description: 'The item.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ItemEnvelope' },
                example: { data: itemExample },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Items'],
        summary: 'Replace an item (full update)',
        description:
          'Full replace — the body matches *create*. Any omitted optional field ' +
          '(e.g. `description`) is reset to its default/null.',
        operationId: 'replaceItem',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateItemInput' },
              example: {
                name: 'Espresso (Double)',
                description: 'Double shot',
                category: 'beverage',
                price: 3.25,
                currency: 'USD',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'The updated item.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ItemEnvelope' },
                example: { data: { ...itemExample, name: 'Espresso (Double)', price: 3.25 } },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Items'],
        summary: 'Update an item (partial)',
        description:
          'Partial update — send only the fields to change; at least one is required. ' +
          '`description` and `category` accept `null` to clear them.',
        operationId: 'updateItem',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateItemInput' },
              examples: {
                price: { summary: 'Change the price only', value: { price: 13.5 } },
                clearCategory: { summary: 'Clear the category', value: { category: null } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'The updated item.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ItemEnvelope' },
                example: { data: { ...itemExample, price: 13.5 } },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Items'],
        summary: 'Delete an item',
        operationId: 'deleteItem',
        responses: {
          '204': { description: 'Deleted. No content.' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },

  components: {
    schemas: {
      // The resource as returned by the API (camelCase, price as a decimal).
      Item: {
        type: 'object',
        required: ['id', 'name', 'description', 'category', 'price', 'currency', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', minLength: 1, maxLength: 200, example: 'Espresso' },
          description: { type: 'string', maxLength: 2000, nullable: true, example: 'Single shot' },
          category: { type: 'string', maxLength: 100, nullable: true, example: 'beverage' },
          price: { type: 'number', minimum: 0, example: 2.5, description: 'Decimal price (>= 0).' },
          currency: { type: 'string', minLength: 3, maxLength: 3, example: 'USD', description: '3-letter ISO code, upper-cased.' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-08-20T07:42:39.161Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-08-20T07:42:39.161Z' },
        },
      },

      // Body for POST and PUT.
      CreateItemInput: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200, example: 'Espresso' },
          description: { type: 'string', maxLength: 2000, example: 'Single shot' },
          category: { type: 'string', maxLength: 100, example: 'beverage' },
          price: { type: 'number', minimum: 0, example: 2.5 },
          currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD', example: 'usd' },
        },
      },

      // Body for PATCH — every field optional, at least one required.
      UpdateItemInput: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200, example: 'Espresso' },
          description: { type: 'string', maxLength: 2000, nullable: true, example: 'Single shot' },
          category: { type: 'string', maxLength: 100, nullable: true, example: 'beverage' },
          price: { type: 'number', minimum: 0, example: 2.5 },
          currency: { type: 'string', minLength: 3, maxLength: 3, example: 'USD' },
        },
      },

      Pagination: {
        type: 'object',
        required: ['total', 'limit', 'offset', 'count'],
        properties: {
          total: { type: 'integer', example: 3, description: 'Total rows matching the filter.' },
          limit: { type: 'integer', example: 20 },
          offset: { type: 'integer', example: 0 },
          count: { type: 'integer', example: 1, description: 'Rows in this page.' },
        },
      },

      ItemEnvelope: {
        type: 'object',
        required: ['data'],
        properties: { data: { $ref: '#/components/schemas/Item' } },
      },

      ItemListEnvelope: {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Item' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },

      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['message'],
            properties: {
              message: { type: 'string', example: 'Validation failed' },
              details: {
                description: 'Optional, structured detail. For validation errors this is zod\'s flattened output.',
                nullable: true,
              },
            },
          },
        },
      },
    },

    responses: {
      ValidationError: {
        description: 'Validation failed (bad body, query or path), or malformed JSON.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                message: 'Validation failed',
                details: { formErrors: [], fieldErrors: { price: ['price cannot be negative'] } },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'The requested item does not exist.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: { message: 'Item 999 not found' } },
          },
        },
      },
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;
