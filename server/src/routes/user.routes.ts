import { Router } from 'express';
import { getSettings, updateReportPreference } from '../controllers/user.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/settings', authenticateJWT, getSettings);
router.put('/report-preference', authenticateJWT, updateReportPreference);

export default router;
