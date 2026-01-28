import { Router } from 'express';
import { register, login, me, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRegistrationKey } from '../middlewares/registrationKey.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/register', authLimiter, requireRegistrationKey, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', authenticateJWT, me);

export default router;
