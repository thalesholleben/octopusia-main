import { Router } from 'express';
import {
  getSettings,
  updateReportPreference,
  changePassword,
  getChatInfo,
  unlinkChat,
  updateNotificationPreferences
} from '../controllers/user.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/settings', authenticateJWT, getSettings);
router.put('/report-preference', authenticateJWT, updateReportPreference);
router.patch('/password', authenticateJWT, changePassword);
router.get('/chat', authenticateJWT, getChatInfo);
router.delete('/chat', authenticateJWT, unlinkChat);
router.put('/notification-preferences', authenticateJWT, updateNotificationPreferences);

export default router;
