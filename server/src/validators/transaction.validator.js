import { z } from 'zod';
import { PAYMENT_METHODS } from '../utils/constants.js';

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Type is required' }),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than zero')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Amount cannot have more than 2 decimal places',
    }),
  category: z.string().min(1, 'Category is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  note: z.string().max(500, 'Note cannot exceed 500 characters').trim().optional().default(''),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('card'),
}).strict();

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Amount cannot have more than 2 decimal places',
    })
    .optional(),
  category: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional(),
  note: z.string().max(500).trim().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
}).strict();

const emptyToUndefined = (schema) =>
  z.preprocess((val) => (val === '' || val === null ? undefined : val), schema.optional());

export const listTransactionsQuerySchema = z.object({
  page: emptyToUndefined(z.coerce.number().int().min(1)).default(1),
  limit: emptyToUndefined(z.coerce.number().int().min(1).max(100)).default(20),
  type: emptyToUndefined(z.enum(['income', 'expense'])),
  category: emptyToUndefined(z.string()),
  from: emptyToUndefined(z.string()),
  to: emptyToUndefined(z.string()),
  q: emptyToUndefined(z.string().max(100)),
  minAmount: emptyToUndefined(z.coerce.number()),
  maxAmount: emptyToUndefined(z.coerce.number()),
  paymentMethod: emptyToUndefined(z.enum(PAYMENT_METHODS)),
  sort: emptyToUndefined(z.enum(['-date', 'date', '-amount', 'amount'])).default('-date'),
});

