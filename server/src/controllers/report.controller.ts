import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { ReportService } from '../services/report.service';
import {
  generateReportSchema,
  reportCallbackSchema,
  reportHistorySchema,
} from '../validators/report.validators';

/**
 * POST /api/user/reports/generate
 * Solicita geração de novo relatório
 */
export const generateReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Validar corpo da requisição
    const { filterStartDate, filterEndDate } = generateReportSchema.parse(req.body);

    // Verificar se pode gerar relatório
    const reportService = new ReportService(prisma);
    const validation = await reportService.canGenerateReport(userId);

    if (!validation.canGenerate) {
      // Retornar erro apropriado baseado na razão
      if (validation.reason?.includes('PRO')) {
        return res.status(403).json({
          error: validation.reason,
          upgrade: true,
        });
      }

      if (validation.reason?.includes('cooldown')) {
        return res.status(403).json({
          error: validation.reason,
          cooldownEndsAt: validation.cooldownEndsAt?.toISOString(),
        });
      }

      if (validation.reason?.includes('limite')) {
        return res.status(403).json({
          error: validation.reason,
          limitReached: true,
        });
      }

      if (validation.reason?.includes('Configure')) {
        return res.status(400).json({
          error: validation.reason,
        });
      }

      // Dados insuficientes: retornar 200 mas com success: false
      if (validation.reason?.includes('insuficientes')) {
        // Criar registro mesmo assim (com countsForLimit: false)
        const result = await reportService.createReport(userId, {
          startDate: filterStartDate,
          endDate: filterEndDate,
        });

        return res.status(200).json(result);
      }

      return res.status(403).json({ error: validation.reason });
    }

    // Criar relatório e disparar webhook
    const result = await reportService.createReport(userId, {
      startDate: filterStartDate,
      endDate: filterEndDate,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('[generateReport] error:', error);
    return res.status(500).json({
      error: 'Erro ao gerar relatório',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

/**
 * GET /api/user/reports/status
 * Retorna status de cooldown, limite mensal e último relatório
 */
export const getReportStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const reportService = new ReportService(prisma);
    const status = await reportService.getReportStatus(userId);

    return res.status(200).json(status);
  } catch (error) {
    console.error('[getReportStatus] error:', error);
    return res.status(500).json({
      error: 'Erro ao buscar status de relatórios',
    });
  }
};

/**
 * GET /api/user/reports/history?limit=10
 * Retorna histórico de relatórios do usuário
 */
export const getReportHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Validar query params
    const { limit } = reportHistorySchema.parse(req.query);

    const reportService = new ReportService(prisma);
    const history = await reportService.getReportHistory(userId, limit);

    return res.status(200).json(history);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('[getReportHistory] error:', error);
    return res.status(500).json({
      error: 'Erro ao buscar histórico de relatórios',
    });
  }
};

/**
 * POST /api/internal/reports/callback
 * Callback do n8n para atualizar status do relatório
 * Protegido por authenticateInternalKey middleware
 */
export const reportCallback = async (req: Request, res: Response) => {
  try {
    // Validar corpo da requisição
    const { reportId, status, content, errorMessage } = reportCallbackSchema.parse(
      req.body
    );

    const reportService = new ReportService(prisma);
    const updatedReport = await reportService.updateReportStatus(
      reportId,
      status,
      content,
      errorMessage
    );

    return res.status(200).json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('[reportCallback] error:', error);
    return res.status(500).json({
      error: 'Erro ao atualizar status do relatório',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};
