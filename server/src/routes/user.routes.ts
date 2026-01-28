import { Router } from 'express';
import {
  getSettings,
  updateReportPreference,
  changePassword,
  getChatInfo,
  unlinkChat,
  updateNotificationPreferences
} from '../controllers/user.controller';
import {
  generateReport,
  getReportStatus,
  getReportHistory,
} from '../controllers/report.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/settings', authenticateJWT, getSettings);
router.put('/report-preference', authenticateJWT, updateReportPreference);
router.patch('/password', authenticateJWT, changePassword);
router.get('/chat', authenticateJWT, getChatInfo);
router.delete('/chat', authenticateJWT, unlinkChat);
router.put('/notification-preferences', authenticateJWT, updateNotificationPreferences);

// Report routes
router.post('/reports/generate', authenticateJWT, generateReport);
router.get('/reports/status', authenticateJWT, getReportStatus);
router.get('/reports/history', authenticateJWT, getReportHistory);

export default router;
