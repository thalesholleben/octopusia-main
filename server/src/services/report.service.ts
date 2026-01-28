import { PrismaClient } from '@prisma/client';
import { addHours, addMinutes, startOfMonth, endOfMonth, subDays } from 'date-fns';
import axios from 'axios';
import type {
  ReportDTO,
  ReportStatusDTO,
  GenerateReportResponse,
  ReportWebhookPayload,
} from '../types/report.types';
import type { FinanceKPIs } from '../types/finance.types';
import { FinanceService } from './finance.service';

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Verifica se o usuário pode gerar um relatório
   * Valida: PRO, cooldown, limite mensal, dados suficientes
   */
  async canGenerateReport(
    userId: string
  ): Promise<{ canGenerate: boolean; reason?: string; cooldownEndsAt?: Date }> {
    // 1. Verificar assinatura PRO
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true, report: true },
    });

    if (!user) {
      return { canGenerate: false, reason: 'Usuário não encontrado' };
    }

    if (user.subscription !== 'pro') {
      return { canGenerate: false, reason: 'Apenas usuários PRO podem gerar relatórios' };
    }

    if (user.report === 'none') {
      return {
        canGenerate: false,
        reason: 'Configure o tipo de relatório nas preferências antes de gerar',
      };
    }

    // 2. Verificar cooldown (24h desde última tentativa)
    const last24Hours = addHours(new Date(), -24);
    const recentReport = await this.prisma.report.findFirst({
      where: {
        userId,
        requestedAt: { gte: last24Hours },
      },
      orderBy: { requestedAt: 'desc' },
    });

    if (recentReport) {
      const cooldownEndsAt = addHours(recentReport.requestedAt, 24);
      return {
        canGenerate: false,
        reason: 'Aguarde o período de cooldown de 24 horas',
        cooldownEndsAt,
      };
    }

    // 3. Verificar limite mensal (3 relatórios que contam para o limite)
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthReports = await this.prisma.report.count({
      where: {
        userId,
        countsForLimit: true,
        requestedAt: { gte: monthStart, lte: monthEnd },
      },
    });

    if (currentMonthReports >= 3) {
      return {
        canGenerate: false,
        reason: 'Limite mensal de 3 relatórios atingido',
      };
    }

    // 4. Verificar dados suficientes
    const hasSufficientData = await this.checkDataSufficiency(userId);
    if (!hasSufficientData) {
      return {
        canGenerate: false,
        reason: 'Dados insuficientes para gerar relatório',
      };
    }

    return { canGenerate: true };
  }

  /**
   * Verifica se há dados suficientes para gerar relatório
   * Critério: Mínimo de 10 registros totais OU 5 registros nos últimos 30 dias
   */
  async checkDataSufficiency(userId: string): Promise<boolean> {
    // Contar total de registros
    const totalRecords = await this.prisma.financeRecord.count({
      where: { userId },
    });

    if (totalRecords >= 10) {
      return true;
    }

    // Contar registros dos últimos 30 dias
    const last30Days = subDays(new Date(), 30);
    const recentRecords = await this.prisma.financeRecord.count({
      where: {
        userId,
        dataComprovante: { gte: last30Days },
      },
    });

    return recentRecords >= 5;
  }

  /**
   * Cria um novo relatório e dispara webhook para n8n
   * SEMPRE cria registro, mesmo sem dados suficientes
   */
  async createReport(
    userId: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<GenerateReportResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscription: true,
        report: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar dados suficientes
    const hasSufficientData = await this.checkDataSufficiency(userId);

    if (!hasSufficientData) {
      // Criar registro com status insufficient_data (não consome limite)
      const report = await this.prisma.report.create({
        data: {
          userId,
          status: 'insufficient_data',
          type: user.report,
          countsForLimit: false,
          errorMessage: 'Dados insuficientes para gerar relatório',
          filterStartDate: filters?.startDate || null,
          filterEndDate: filters?.endDate || null,
        },
      });

      return {
        success: false,
        message:
          'Você precisa ter pelo menos 10 registros financeiros ou 5 registros nos últimos 30 dias para gerar um relatório.',
        report: this.mapReportToDTO(report),
        insufficientData: true,
      };
    }

    // Criar registro com status pending (consome limite)
    const report = await this.prisma.report.create({
      data: {
        userId,
        status: 'pending',
        type: user.report,
        countsForLimit: true,
        filterStartDate: filters?.startDate || null,
        filterEndDate: filters?.endDate || null,
      },
    });

    try {
      // Buscar KPIs para enviar no webhook
      const financeService = new FinanceService(this.prisma);
      const kpis = await financeService.getKPIs(userId, {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });

      // Preparar payload reduzido para n8n
      const webhookPayload: ReportWebhookPayload = {
        reportId: report.id,
        userId: user.id,
        userEmail: user.email,
        displayName: user.displayName || user.email,
        reportType: user.report as 'simple' | 'advanced',
        timestamp: new Date().toISOString(),
        filters: {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        },
        summary: {
          kpis: {
            saldo: kpis.saldo,
            entradas: kpis.entradas,
            saidas: kpis.saidas,
            lucroLiquido: kpis.lucroLiquido,
            margemLiquida: kpis.margemLiquida,
            ticketMedio: kpis.ticketMedio,
            mediaMensal: kpis.mediaMensal,
            totalTransacoes: kpis.totalTransacoes,
          },
        },
      };

      // Disparar webhook para n8n
      const webhookUrl = process.env.REPORTS_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('REPORTS_WEBHOOK_URL não configurado');
      }

      await axios.post(webhookUrl, webhookPayload, {
        timeout: 10000, // 10 segundos
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Atualizar status para generating
      await this.prisma.report.update({
        where: { id: report.id },
        data: { status: 'generating' },
      });

      return {
        success: true,
        message: 'Relatório sendo gerado. Você receberá por email em até 20 minutos.',
        report: this.mapReportToDTO(report),
      };
    } catch (error) {
      // Se webhook falhar, marcar como failed
      await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Erro ao disparar webhook',
        },
      });

      throw new Error('Erro ao iniciar geração do relatório');
    }
  }

  /**
   * Atualiza status do relatório (callback do n8n)
   */
  async updateReportStatus(
    reportId: string,
    status: 'sent' | 'failed',
    content?: string,
    errorMessage?: string
  ): Promise<ReportDTO> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Relatório não encontrado');
    }

    const updateData: any = {
      status,
      generatedAt: new Date(),
    };

    if (status === 'sent') {
      updateData.sentAt = new Date();
      updateData.content = content || null;
    } else if (status === 'failed') {
      updateData.errorMessage = errorMessage || 'Erro na geração do relatório';
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: updateData,
    });

    return this.mapReportToDTO(updatedReport);
  }

  /**
   * Retorna status de cooldown e limite mensal
   */
  async getReportStatus(userId: string): Promise<ReportStatusDTO> {
    const validation = await this.canGenerateReport(userId);

    // Buscar estatísticas do mês atual
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthReports = await this.prisma.report.count({
      where: {
        userId,
        countsForLimit: true,
        requestedAt: { gte: monthStart, lte: monthEnd },
      },
    });

    const remainingReports = Math.max(0, 3 - currentMonthReports);

    // Buscar último relatório
    const lastReport = await this.prisma.report.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });

    return {
      canGenerate: validation.canGenerate,
      reason: validation.reason,
      cooldownEndsAt: validation.cooldownEndsAt?.toISOString(),
      remainingReports,
      totalReportsThisMonth: currentMonthReports,
      lastReport: lastReport ? this.mapReportToDTO(lastReport) : undefined,
      hasInsufficientData: validation.reason === 'Dados insuficientes para gerar relatório',
    };
  }

  /**
   * Retorna histórico de relatórios do usuário
   */
  async getReportHistory(userId: string, limit: number = 10): Promise<ReportDTO[]> {
    const reports = await this.prisma.report.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      take: limit,
    });

    return reports.map((report) => this.mapReportToDTO(report));
  }

  /**
   * Marca relatórios órfãos (>30min sem callback) como failed
   * Deve ser executado via cron job
   */
  async markTimeoutReports(): Promise<number> {
    const timeoutThreshold = addMinutes(new Date(), -30);

    const result = await this.prisma.report.updateMany({
      where: {
        status: { in: ['pending', 'generating'] },
        requestedAt: { lt: timeoutThreshold },
      },
      data: {
        status: 'failed',
        errorMessage: 'Timeout na geração do relatório',
      },
    });

    return result.count;
  }

  /**
   * Mapeia Report do Prisma para DTO
   */
  private mapReportToDTO(report: any): ReportDTO {
    return {
      id: report.id,
      userId: report.userId,
      status: report.status,
      type: report.type,
      content: report.content,
      requestedAt: report.requestedAt.toISOString(),
      generatedAt: report.generatedAt?.toISOString() || null,
      sentAt: report.sentAt?.toISOString() || null,
      countsForLimit: report.countsForLimit,
      errorMessage: report.errorMessage,
      filterStartDate: report.filterStartDate,
      filterEndDate: report.filterEndDate,
    };
  }
}
