import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoryQuerySchema,
} from '../validators/category.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: listCategoryQuerySchema }),
  asyncHandler(CategoryController.list)
);

router.post(
  '/',
  validate({ body: createCategorySchema }),
  asyncHandler(CategoryController.create)
);

router.patch(
  '/:id',
  validate({ body: updateCategorySchema }),
  asyncHandler(CategoryController.update)
);

router.delete('/:id', asyncHandler(CategoryController.delete));

export default router;

