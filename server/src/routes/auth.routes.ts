import { Router } from 'express';
import { register, login, me, forgotPassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRegistrationKey } from '../middlewares/registrationKey.middleware';

const router = Router();

router.post('/register', requireRegistrationKey, register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticateJWT, me);

export default router;
