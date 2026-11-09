import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  upsertBudgetSchema,
  copyBudgetSchema,
  getBudgetsQuerySchema,
} from '../validators/budget.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: getBudgetsQuerySchema }),
  asyncHandler(BudgetController.list)
);

router.put(
  '/',
  validate({ body: upsertBudgetSchema }),
  asyncHandler(BudgetController.upsert)
);

router.delete('/:id', asyncHandler(BudgetController.delete));

router.post(
  '/copy',
  validate({ body: copyBudgetSchema }),
  asyncHandler(BudgetController.copy)
);

export default router;

