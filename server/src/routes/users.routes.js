import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.use(authenticate);

router.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  asyncHandler(UserController.updateProfile)
);

router.patch(
  '/me/password',
  validate({ body: changePasswordSchema }),
  asyncHandler(UserController.changePassword)
);

router.delete(
  '/me',
  validate({ body: deleteAccountSchema }),
  asyncHandler(UserController.deleteAccount)
);

export default router;

