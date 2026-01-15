import { Router } from 'express';
import { register, login, me, forgotPassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRegistrationKey } from '../middlewares/registrationKey.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/register', authLimiter, requireRegistrationKey, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.get('/me', authenticateJWT, me);

export default router;
