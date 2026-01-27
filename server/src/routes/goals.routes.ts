import { Router } from 'express';
import {
  getGoals,
  getGoalStats,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  syncGoalProgress,
  getGamification,
  getGoalAlerts,
  resetLevel,
} from '../controllers/goals.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateJWT);

// Rotas específicas ANTES de rotas com parâmetros dinâmicos
router.get('/stats', getGoalStats);
router.get('/alerts', getGoalAlerts);
router.get('/user/gamification', getGamification);
router.post('/user/reset-level', resetLevel);

// Goals CRUD
router.get('/', getGoals);
router.get('/:id', getGoal);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/sync', syncGoalProgress);

export default router;
