import type { Request, Response } from 'express';
import { HttpError } from '../utils/http-error.js';
import { itemsRepository } from './items.repository.js';
import {
  createItemSchema,
  idParamSchema,
  listItemsQuerySchema,
  replaceItemSchema,
  updateItemSchema,
} from './items.schema.js';

// Handlers are synchronous (better-sqlite3 is), so throwing on bad input or a
// missing row is fine — Express routes it to the error middleware.

export function createItem(req: Request, res: Response): void {
  const input = createItemSchema.parse(req.body);
  const item = itemsRepository.create(input);
  res.status(201).json({ data: item });
}

export function listItems(req: Request, res: Response): void {
  const query = listItemsQuerySchema.parse(req.query);

  // zod validates each bound on its own; this is the only cross-field check
  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice
  ) {
    throw new HttpError(400, 'minPrice cannot be greater than maxPrice');
  }

  const { items, total } = itemsRepository.list(query);
  res.json({
    data: items,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      count: items.length,
    },
  });
}

export function getItem(req: Request, res: Response): void {
  const { id } = idParamSchema.parse(req.params);
  const item = itemsRepository.findById(id);
  if (!item) throw new HttpError(404, `Item ${id} not found`);
  res.json({ data: item });
}

export function replaceItem(req: Request, res: Response): void {
  const { id } = idParamSchema.parse(req.params);
  const input = replaceItemSchema.parse(req.body);
  const item = itemsRepository.replace(id, input);
  if (!item) throw new HttpError(404, `Item ${id} not found`);
  res.json({ data: item });
}

export function updateItem(req: Request, res: Response): void {
  const { id } = idParamSchema.parse(req.params);
  const input = updateItemSchema.parse(req.body);
  const item = itemsRepository.update(id, input);
  if (!item) throw new HttpError(404, `Item ${id} not found`);
  res.json({ data: item });
}

export function deleteItem(req: Request, res: Response): void {
  const { id } = idParamSchema.parse(req.params);
  const deleted = itemsRepository.delete(id);
  if (!deleted) throw new HttpError(404, `Item ${id} not found`);
  res.status(204).send();
}
