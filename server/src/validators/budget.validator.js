import { z } from 'zod';

export const upsertBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
  category: z.string().nullable().optional().default(null),
  limit: z.number().positive('Limit must be greater than zero'),
}).strict();

export const copyBudgetSchema = z.object({
  fromMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'fromMonth must be in YYYY-MM format'),
  toMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'toMonth must be in YYYY-MM format'),
}).strict();

export const getBudgetsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format').optional(),
});

