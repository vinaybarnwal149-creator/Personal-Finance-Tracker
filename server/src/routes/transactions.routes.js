import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} from '../validators/transaction.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate({ body: createTransactionSchema }),
  asyncHandler(TransactionController.create)
);

router.get(
  '/',
  validate({ query: listTransactionsQuerySchema }),
  asyncHandler(TransactionController.list)
);

router.get('/:id', asyncHandler(TransactionController.getById));

router.patch(
  '/:id',
  validate({ body: updateTransactionSchema }),
  asyncHandler(TransactionController.update)
);

router.delete('/:id', asyncHandler(TransactionController.delete));

export default router;

