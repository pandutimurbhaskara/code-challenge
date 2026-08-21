# Problem 5 — Items Price API

A small CRUD backend for managing the **price of items**, built with **Express.js**,
**TypeScript**, and **SQLite** (via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)).

It exposes the five required interface functions:

| # | Capability                        | Endpoint                    |
|---|-----------------------------------|-----------------------------|
| 1 | Create a resource                 | `POST /api/items`           |
| 2 | List resources with basic filters | `GET /api/items`            |
| 3 | Get details of a resource         | `GET /api/items/:id`        |
| 4 | Update resource details           | `PUT` / `PATCH /api/items/:id` |
| 5 | Delete a resource                 | `DELETE /api/items/:id`     |

---

## Tech stack

- **Runtime:** Node.js ≥ 20 (developed on Node 22)
- **Framework:** Express 4
- **Language:** TypeScript (strict mode), ESM
- **Database:** SQLite through `better-sqlite3` (synchronous, zero-config, file-backed)
- **Validation:** [`zod`](https://zod.dev) for request bodies, query params and path params
- **API docs:** OpenAPI 3.0.3 served interactively via [`swagger-ui-express`](https://github.com/scottie1984/swagger-ui-express) at `/docs`
- **Testing:** [`vitest`](https://vitest.dev) + [`supertest`](https://github.com/ladjs/supertest) (unit + HTTP integration)
- **Dev runner:** [`tsx`](https://github.com/privatenumber/tsx) (run TS directly, watch mode)

---

## Project structure

```
src/problem5/
├── package.json
├── tsconfig.json
├── env.example              # copy to .env
├── README.md
├── vitest.config.ts         # test runner config (in-memory DB)
├── tests/                   # unit + HTTP integration tests
│   ├── setup.ts             # pins DATABASE_PATH=:memory: before imports
│   ├── helpers.ts           # migrate / reset the test DB
│   ├── items.schema.test.ts     # zod validation (pure unit)
│   ├── items.repository.test.ts # SQL data access (in-memory DB)
│   └── items.api.test.ts        # full request lifecycle (supertest)
└── src/
    ├── server.ts            # entry point: migrate() + listen()
    ├── app.ts               # Express app factory (routes, middleware, /docs)
    ├── config.ts            # typed env configuration
    ├── db/
    │   ├── index.ts         # SQLite connection + schema migration
    │   └── seed.ts          # optional sample data (`npm run seed`)
    ├── docs/
    │   └── openapi.ts       # OpenAPI 3.0.3 document (served at /docs)
    ├── items/
    │   ├── items.routes.ts       # route table
    │   ├── items.controller.ts   # request/response handling
    │   ├── items.repository.ts   # SQL data access
    │   └── items.schema.ts       # zod validation schemas + types
    ├── middleware/
    │   ├── error-handler.ts # central error -> JSON translation
    │   └── not-found.ts     # 404 fallback
    └── utils/
        └── http-error.ts    # HttpError class
```

The code is layered — **routes → controller → repository** — so validation, HTTP
concerns, and data access stay separate and testable.

---

## Configuration

Configuration is read from environment variables (a `.env` file is supported via
`dotenv`). Copy the example file and adjust as needed:

```bash
cp env.example .env
```

| Variable        | Default            | Description                                                        |
|-----------------|--------------------|--------------------------------------------------------------------|
| `PORT`          | `3000`             | HTTP port to listen on.                                            |
| `DATABASE_PATH` | `./data/items.db`  | SQLite file path. Use `:memory:` for an ephemeral in-memory DB.    |
| `NODE_ENV`      | `development`      | `development` includes extra error detail in 500 responses.        |

The SQLite file (and its parent directory) is created automatically on first run,
and the schema is applied idempotently at startup — **no manual migration step
needed**.

---

## Getting started

From this directory (`src/problem5`):

```bash
# 1. Install dependencies
npm install

# 2. (optional) configure environment
cp env.example .env

# 3a. Run in development (auto-reload on changes)
npm run dev

# 3b. …or build and run for production
npm run build
npm start
```

The server prints its address on boot:

```
Items Price API listening on http://localhost:3000 (development)
```

### Optional: seed sample data

```bash
npm run seed
```

This wipes the `items` table and inserts a handful of sample rows.

### NPM scripts

| Script             | Description                                   |
|--------------------|-----------------------------------------------|
| `npm run dev`      | Start with `tsx` watch mode (hot reload).     |
| `npm run build`    | Compile TypeScript to `dist/`.                |
| `npm start`        | Run the compiled server (`dist/server.js`).   |
| `npm run typecheck`| Type-check without emitting.                  |
| `npm run seed`     | Reset + insert sample data.                   |
| `npm test`         | Run the unit + integration test suite once.   |
| `npm run test:watch`| Re-run tests on change (watch mode).         |
| `npm run test:coverage`| Run tests and print a coverage report.    |

---

## API documentation (Swagger / OpenAPI)

The API is described by an **OpenAPI 3.0.3** document (`src/docs/openapi.ts`) that
mirrors the zod schemas — every endpoint, request/response payload type, and
example lives there.

Once the server is running:

- **Interactive docs (Swagger UI):** <http://localhost:3000/docs> — browse every
  endpoint, see the payload types and examples, and **"Try it out"** to fire real
  requests against the running server.
- **Raw spec:** <http://localhost:3000/openapi.json> — import into Postman,
  Insomnia, or a client generator.

### Example payloads

**`POST /api/items` — create** (`name` + `price` required; `currency` defaults to `USD`):

```jsonc
// full
{ "name": "Espresso", "description": "Single shot", "category": "beverage", "price": 2.5, "currency": "usd" }
// minimal
{ "name": "Blueberry Muffin", "price": 2.95 }
```

**`PATCH /api/items/:id` — partial update** (send only what changes; `null` clears):

```jsonc
{ "price": 13.5 }          // change the price
{ "category": null }       // clear the category
```

| Field         | Type             | Required           | Notes                                  |
|---------------|------------------|--------------------|----------------------------------------|
| `name`        | string           | yes (create/PUT)   | 1–200 chars, trimmed.                  |
| `description` | string \| null   | no                 | ≤ 2000 chars. `null` clears it (PATCH). |
| `category`    | string \| null   | no                 | ≤ 100 chars. `null` clears it (PATCH).  |
| `price`       | number           | yes (create/PUT)   | ≥ 0, decimal.                          |
| `currency`    | string           | no (default `USD`) | 3-letter ISO code, upper-cased.        |

---

## Testing

Tests run on **Vitest** with **Supertest** for HTTP, against an **in-memory
SQLite database** (`tests/setup.ts` pins `DATABASE_PATH=:memory:` before any app
module loads), so the suite is hermetic — it never touches `./data/items.db` and
needs no teardown.

```bash
npm test              # run once
npm run test:coverage # with coverage report
```

Three layers are covered:

| File                            | Layer            | What it checks                                                        |
|---------------------------------|------------------|-----------------------------------------------------------------------|
| `items.schema.test.ts`          | Validation (unit)| zod rules: required fields, bounds, defaults, currency casing, coercion. |
| `items.repository.test.ts`      | Data access      | SQL for CRUD, cents↔decimal conversion, filtering, sorting, pagination. |
| `items.api.test.ts`             | HTTP (integration)| Full request lifecycle: status codes, envelopes, validation & 404s.  |

---

## Data model

An **item** represents a priced product.

| Field         | Type              | Notes                                                             |
|---------------|-------------------|-------------------------------------------------------------------|
| `id`          | integer           | Auto-generated primary key.                                       |
| `name`        | string            | Required, 1–200 chars.                                            |
| `description` | string \| null    | Optional, ≤ 2000 chars.                                          |
| `category`    | string \| null    | Optional, ≤ 100 chars. Filterable.                              |
| `price`       | number            | Required, ≥ 0. A decimal (e.g. `2.5`).                          |
| `currency`    | string            | 3-letter ISO code, upper-cased. Defaults to `USD`.               |
| `createdAt`   | string (ISO 8601) | Set on creation.                                                  |
| `updatedAt`   | string (ISO 8601) | Updated on every mutation.                                        |

> **Money handling:** prices are stored internally as integer minor units
> (`price_cents`) to avoid floating-point rounding errors, and exposed in the API
> as a decimal `price`.

---

## API reference

Base URL: `http://localhost:<PORT>`

All responses are JSON. Successful responses use a `{ "data": ... }` envelope;
errors use `{ "error": { "message", "details?" } }`.

### Health, docs & index

- `GET /health` → `{ "status": "ok" }`
- `GET /` → self-describing list of endpoints
- `GET /docs` → interactive Swagger UI
- `GET /openapi.json` → raw OpenAPI 3.0.3 spec

### 1. Create — `POST /api/items`

Request body:

```json
{
  "name": "Espresso",
  "description": "Single shot",
  "category": "beverage",
  "price": 2.5,
  "currency": "usd"
}
```

`201 Created`:

```json
{
  "data": {
    "id": 1,
    "name": "Espresso",
    "description": "Single shot",
    "category": "beverage",
    "price": 2.5,
    "currency": "USD",
    "createdAt": "2026-08-20T07:42:39.161Z",
    "updatedAt": "2026-08-20T07:42:39.161Z"
  }
}
```

Only `name` and `price` are required; `currency` defaults to `USD`.

### 2. List — `GET /api/items`

Supports filtering, sorting and pagination via query parameters:

| Query param | Type    | Description                                              |
|-------------|---------|----------------------------------------------------------|
| `q`         | string  | Case-insensitive partial match on `name`.                |
| `category`  | string  | Exact category match.                                    |
| `currency`  | string  | Exact currency match (3-letter code).                    |
| `minPrice`  | number  | Minimum price (inclusive).                               |
| `maxPrice`  | number  | Maximum price (inclusive).                               |
| `sortBy`    | enum    | `name` \| `price` \| `createdAt` (default `createdAt`).  |
| `order`     | enum    | `asc` \| `desc` (default `desc`).                        |
| `limit`     | integer | Page size, 1–100 (default `20`).                         |
| `offset`    | integer | Rows to skip (default `0`).                              |

`200 OK`:

```json
{
  "data": [ { "id": 2, "name": "Ceramic Mug", "price": 12, "currency": "USD", "...": "..." } ],
  "pagination": { "total": 3, "limit": 20, "offset": 0, "count": 1 }
}
```

### 3. Get one — `GET /api/items/:id`

`200 OK` with `{ "data": { ... } }`, or `404` if not found.

### 4. Update — `PUT` / `PATCH /api/items/:id`

- **`PUT`** — full replace. Requires the same body as *create*; any omitted
  optional field (e.g. `description`) is reset to its default/null.
- **`PATCH`** — partial update. Send only the fields you want to change; at least
  one is required. `description` and `category` accept `null` to clear them.

```bash
# partial
curl -X PATCH http://localhost:3000/api/items/2 \
  -H 'Content-Type: application/json' \
  -d '{"price": 13.5}'
```

`200 OK` with the updated item, or `404` if not found.

### 5. Delete — `DELETE /api/items/:id`

`204 No Content` on success, or `404` if not found.

---

## Error handling

| Status | When                                                                       |
|--------|----------------------------------------------------------------------------|
| `400`  | Validation failure (bad body, query, or path), or malformed JSON.          |
| `404`  | Resource / route not found.                                                |
| `500`  | Unexpected server error.                                                   |

Validation errors include a `details` object (from zod) pinpointing each field:

```json
{
  "error": {
    "message": "Validation failed",
    "details": { "formErrors": [], "fieldErrors": { "price": ["price cannot be negative"] } }
  }
}
```

---

## Quick end-to-end example

```bash
BASE=http://localhost:3000

# create
curl -s -X POST $BASE/api/items -H 'Content-Type: application/json' \
  -d '{"name":"Ceramic Mug","category":"merchandise","price":12}'

# list with filters
curl -s "$BASE/api/items?category=merchandise&minPrice=10&sortBy=price&order=asc"

# get one
curl -s $BASE/api/items/1

# update (partial)
curl -s -X PATCH $BASE/api/items/1 -H 'Content-Type: application/json' -d '{"price":9.99}'

# delete
curl -s -X DELETE $BASE/api/items/1 -o /dev/null -w '%{http_code}\n'
```
