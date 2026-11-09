import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40, 'Name cannot exceed 40 characters'),
  type: z.enum(['income', 'expense'], { required_error: 'Type is required' }),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  icon: z.string().optional().default('tag'),
}).strict();

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  icon: z.string().optional(),
}).strict();

export const listCategoryQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
});

