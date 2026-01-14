import { Router } from 'express';
import { getFinanceRecords, getAIAlerts, getStatistics, getClients } from '../controllers/finance.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateJWT);

router.get('/records', getFinanceRecords);
router.get('/alerts', getAIAlerts);
router.get('/statistics', getStatistics);
router.get('/clients', getClients);

export default router;
