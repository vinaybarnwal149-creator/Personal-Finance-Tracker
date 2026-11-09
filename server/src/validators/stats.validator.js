import { z } from 'zod';

const emptyToUndefined = (schema) =>
  z.preprocess((val) => (val === '' || val === null ? undefined : val), schema.optional());

export const statsQuerySchema = z.object({
  from: emptyToUndefined(z.string()),
  to: emptyToUndefined(z.string()),
  type: emptyToUndefined(z.enum(['income', 'expense'])),
  categoryId: emptyToUndefined(z.string()),
  months: emptyToUndefined(z.coerce.number().int().min(1).max(12)).default(6),
  limit: emptyToUndefined(z.coerce.number().int().min(1).max(50)).default(5),
});

