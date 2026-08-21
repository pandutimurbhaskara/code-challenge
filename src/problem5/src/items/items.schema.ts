import { z } from 'zod';

// Shared field rules, reused across the schemas below.
const name = z.string().trim().min(1, 'name is required').max(200);
const description = z.string().trim().max(2000);
const category = z.string().trim().max(100);
const price = z
  .number({ invalid_type_error: 'price must be a number' })
  .nonnegative('price cannot be negative')
  .finite();
// ISO 4217, stored upper-case so "usd" and "USD" don't split into two currencies
const currency = z
  .string()
  .trim()
  .length(3, 'currency must be a 3-letter ISO code')
  .transform((c) => c.toUpperCase());

export const createItemSchema = z.object({
  name,
  description: description.optional(),
  category: category.optional(),
  price,
  currency: currency.optional().default('USD'),
});

// PUT replaces the whole thing, so the body matches create.
export const replaceItemSchema = createItemSchema;

// PATCH: everything optional, but at least one field is required.
// null on description/category means "clear it".
export const updateItemSchema = z
  .object({
    name: name.optional(),
    description: description.nullable().optional(),
    category: category.nullable().optional(),
    price: price.optional(),
    currency: currency.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listItemsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(), // partial name match
  category: category.optional(),
  currency: currency.optional(),
  minPrice: z.coerce.number().nonnegative().finite().optional(),
  maxPrice: z.coerce.number().nonnegative().finite().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'id must be a number' }).int().positive(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type ReplaceItemInput = z.infer<typeof replaceItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
