import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '../utils/constants.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
  email: z.string().trim().email('Invalid email address').max(254).toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().default('USD'),
  timezone: z.string().optional().default('UTC'),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
}).strict();

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required'),
}).strict();

