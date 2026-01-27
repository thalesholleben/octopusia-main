import { Router } from 'express';
import {
  getFinanceRecords,
  createFinanceRecord,
  updateFinanceRecord,
  deleteFinanceRecord,
  createBalanceAdjustment,
  getAIAlerts,
  getAlertsPage,
  getStatistics,
  getClients,
  getCategories,
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  getFinanceSummary,
} from '../controllers/finance.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateJWT);

// Finance Records CRUD
router.get('/records', getFinanceRecords);
router.post('/records', createFinanceRecord);
router.put('/records/:id', updateFinanceRecord);
router.delete('/records/:id', deleteFinanceRecord);

// Balance Adjustment
router.post('/balance-adjustment', createBalanceAdjustment);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCustomCategory);
router.put('/categories/:id', updateCustomCategory);
router.delete('/categories/:id', deleteCustomCategory);

// Summary (KPIs + records + alerts)
router.get('/summary', getFinanceSummary);

// Other endpoints
router.get('/alerts/page', getAlertsPage);
router.get('/alerts', getAIAlerts);
router.get('/statistics', getStatistics);
router.get('/clients', getClients);

export default router;
