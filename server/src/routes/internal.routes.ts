import { Router } from 'express';
import { authenticateInternalKey } from '../middlewares/internal.middleware';
import { getInternalFinanceSummary } from '../controllers/finance.controller';

const router = Router();

/**
 * Rotas internas para uso exclusivo de automações (n8n)
 * Todas as rotas requerem o header X-Internal-Key
 */

/**
 * GET /api/internal/finance/summary
 *
 * Retorna apenas KPIs financeiros para um usuário específico
 * Usado por automações (n8n) que precisam apenas de métricas
 *
 * Headers:
 *   - X-Internal-Key: Chave de autenticação interna
 *
 * Query Params:
 *   - userId (obrigatório): UUID do usuário
 *   - startDate (opcional): Data inicial no formato YYYY-MM-DD
 *   - endDate (opcional): Data final no formato YYYY-MM-DD
 *   - tipo (opcional): 'entrada' ou 'saida'
 *   - categoria (opcional): Nome da categoria
 *
 * Response:
 *   {
 *     kpis: {
 *       saldo, entradas, saidas, lucroLiquido, margemLiquida,
 *       ticketMedio, ticketMedioEntrada, mediaMensal, variacaoMensal,
 *       variacaoMensalReais, variacaoMargem, variacaoSaidas, totalTransacoes
 *     }
 *   }
 */
router.get('/finance/summary', authenticateInternalKey, getInternalFinanceSummary);

export default router;
