import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { statsQuerySchema } from '../validators/stats.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/summary',
  validate({ query: statsQuerySchema }),
  asyncHandler(StatsController.getSummary)
);

router.get(
  '/by-category',
  validate({ query: statsQuerySchema }),
  asyncHandler(StatsController.getByCategory)
);

router.get(
  '/monthly',
  validate({ query: statsQuerySchema }),
  asyncHandler(StatsController.getMonthly)
);

router.get(
  '/daily',
  validate({ query: statsQuerySchema }),
  asyncHandler(StatsController.getDaily)
);

router.get(
  '/top-transactions',
  validate({ query: statsQuerySchema }),
  asyncHandler(StatsController.getTopTransactions)
);

export default router;

