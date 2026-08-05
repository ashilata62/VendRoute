import { Router } from 'express';
import {
  loginController,
  registerController,
  getProfileController,
  forgotPasswordController,
  verifyOtpController,
  resetPasswordController
} from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), loginController);
router.post('/register', validateRequest(registerSchema), registerController);
router.get('/me', authenticateJWT, getProfileController);

router.post('/forgot-password', forgotPasswordController);
router.post('/verify-otp', verifyOtpController);
router.post('/reset-password', resetPasswordController);

export default router;
