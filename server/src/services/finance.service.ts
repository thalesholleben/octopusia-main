import { PrismaClient } from '@prisma/client';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import type {
  FinanceFilters,
  FinanceKPIs,
  FinanceRecordDTO,
  AIAlertDTO,
  AdvancedHealthMetricsResponse,
  PillarResult,
  TrendData,
} from '../types/finance.types';
import { RecurrenceService } from './recurrence.service';

export class FinanceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calcula todos os KPIs financeiros
   */
  async getKPIs(
    userId: string,
    filters: FinanceFilters
  ): Promise<FinanceKPIs> {
    const recurrenceService = new RecurrenceService(this.prisma);

    // ⚠️ ORDEM IMPORTA:
    // 1. Sincronizar isFuture PRIMEIRO (recalcula baseado em dataComprovante > hoje)
    await recurrenceService.syncIsFutureFlags(userId);

    // 2. Buffer com GUARDAS (só executa se necessário)
    await recurrenceService.ensureRecurrenceBuffer(userId);

    // 3. Buscar registros filtrados (para cálculos que respeitam filtros)
    // IMPORTANTE: includeFuture=false para excluir registros futuros dos KPIs
    const filteredRecords = await this.getRecords(userId, filters, false);

    // 4. Buscar TODOS os registros (para mediaMensal que ignora filtros)
    const allRecords = await this.getAllRecords(userId);

    // Calcular entradas, saídas e saldo
    const entradas = filteredRecords
      .filter((r) => r.tipo === 'entrada')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const saidas = filteredRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const saldo = entradas - saidas;
    const lucroLiquido = entradas - saidas;

    // Calcular margem líquida
    const margemLiquida = entradas > 0 ? (lucroLiquido / entradas) * 100 : 0;

    // Calcular ticket médio de saída (apenas transações de saída)
    const totalTransacoes = filteredRecords.length;
    const totalSaidasTransacoes = filteredRecords.filter(
      (r) => r.tipo === 'saida'
    ).length;
    const ticketMedio =
      totalSaidasTransacoes > 0 ? saidas / totalSaidasTransacoes : 0;

    // Calcular ticket médio de entrada (apenas transações de entrada)
    const totalEntradasTransacoes = filteredRecords.filter(
      (r) => r.tipo === 'entrada'
    ).length;
    const ticketMedioEntrada =
      totalEntradasTransacoes > 0 ? entradas / totalEntradasTransacoes : 0;

    // Calcular média mensal (últimos 6 meses - IGNORA FILTROS)
    const mediaMensal = this.calculateMediaMensal(allRecords);

    // Calcular variação mensal (compara com mês anterior)
    const { variacaoMensal, variacaoMensalReais, variacaoMargem, variacaoSaidas } =
      await this.calculateVariacoes(userId, filters, saidas, margemLiquida);

    return {
      saldo,
      entradas,
      saidas,
      lucroLiquido,
      margemLiquida,
      ticketMedio,
      ticketMedioEntrada,
      mediaMensal,
      variacaoMensal,
      variacaoMensalReais,
      variacaoMargem,
      variacaoSaidas,
      totalTransacoes,
    };
  }

  /**
   * Buscar registros com filtros aplicados
   */
  async getRecords(
    userId: string,
    filters: FinanceFilters,
    includeFuture: boolean = false
  ): Promise<FinanceRecordDTO[]> {
    const where: any = { userId };

    // ⚠️ CRÍTICO: Filtro de futuros
    // Usar dataComprovante como fonte de verdade, isFuture como otimização
    if (!includeFuture) {
      const today = startOfDay(new Date());
      where.dataComprovante = { lte: today };
    }

    // Aplicar filtros de data (UTC)
    if (filters.startDate || filters.endDate) {
      if (!where.dataComprovante) {
        where.dataComprovante = {};
      }
      if (filters.startDate) {
        // Parse como UTC: YYYY-MM-DD -> início do dia em UTC
        const startDate = startOfDay(parseISO(filters.startDate + 'T00:00:00Z'));
        // Combinar com filtro de futuros (pegar o maior entre startDate e o filtro existente)
        where.dataComprovante.gte = startDate;
      }
      if (filters.endDate) {
        // Parse como UTC: YYYY-MM-DD -> fim do dia em UTC
        const endDate = endOfDay(parseISO(filters.endDate + 'T23:59:59Z'));
        // Combinar com filtro de futuros (pegar o menor entre endDate e o filtro existente)
        if (where.dataComprovante.lte) {
          where.dataComprovante.lte = endDate < where.dataComprovante.lte ? endDate : where.dataComprovante.lte;
        } else {
          where.dataComprovante.lte = endDate;
        }
      }
    }

    // Aplicar filtros de tipo e categoria
    if (filters.tipo) {
      where.tipo = filters.tipo;
    }
    if (filters.categoria) {
      where.categoria = filters.categoria;
    }

    const records = await this.prisma.financeRecord.findMany({
      where,
      orderBy: { dataComprovante: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      tipo: r.tipo as 'entrada' | 'saida',
      valor: Number(r.valor),
      categoria: r.categoria,
      de: r.de,
      para: r.para,
      dataComprovante: r.dataComprovante.toISOString(),
      classificacao: r.classificacao || undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Buscar TODOS os registros (sem filtros de data/tipo/categoria)
   * Usado para calcular mediaMensal que ignora filtros do usuário
   * ⚠️ IMPORTANTE: Ainda filtra registros futuros
   */
  private async getAllRecords(userId: string): Promise<FinanceRecordDTO[]> {
    const today = startOfDay(new Date());
    const records = await this.prisma.financeRecord.findMany({
      where: {
        userId,
        dataComprovante: { lte: today }, // Excluir registros futuros
      },
      orderBy: { dataComprovante: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      tipo: r.tipo as 'entrada' | 'saida',
      valor: Number(r.valor),
      categoria: r.categoria,
      de: r.de,
      para: r.para,
      dataComprovante: r.dataComprovante.toISOString(),
      classificacao: r.classificacao || undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Buscar alertas IA
   */
  async getAlerts(userId: string): Promise<AIAlertDTO[]> {
    const alerts = await this.prisma.aiAlert.findMany({
      where: {
        userId,
        status: null,  // Apenas alertas ativos (não concluídos ou ignorados)
      },
      orderBy: [{ prioridade: 'asc' }, { createdAt: 'desc' }],
      take: 10,
    });

    // Mapear prioridade para ordem correta: alta > media > baixa
    const priorityOrder = { alta: 1, media: 2, baixa: 3 };

    return alerts
      .sort((a, b) => {
        const orderA = priorityOrder[a.prioridade as keyof typeof priorityOrder];
        const orderB = priorityOrder[b.prioridade as keyof typeof priorityOrder];
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((a) => ({
        id: a.id,
        userId: a.userId,
        aviso: a.aviso,
        justificativa: a.justificativa || undefined,
        prioridade: a.prioridade as 'baixa' | 'media' | 'alta',
        status: a.status as 'concluido' | 'ignorado' | null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }));
  }

  /**
   * Ajusta o saldo criando um registro financeiro com a diferença
   * Limite: 3 ajustes por mês
   */
  async adjustBalance(userId: string, targetBalance: number) {
    // 1. Check monthly limit (max 3 per month)
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const adjustmentCount = await this.prisma.financeRecord.count({
      where: {
        userId,
        classificacao: 'ajuste_saldo',
        dataComprovante: { gte: monthStart, lte: monthEnd },
      },
    });

    if (adjustmentCount >= 3) {
      throw {
        status: 403,
        error: 'LIMITE_AJUSTE_ATINGIDO',
        message: 'Você já realizou 3 ajustes de saldo este mês. Muitos ajustes podem distorcer seus gráficos. O limite será liberado no próximo mês.',
        limit: 3,
        current: adjustmentCount,
      };
    }

    // 2. Calculate GLOBAL balance (all records, no filters)
    const allRecords = await this.prisma.financeRecord.findMany({
      where: { userId },
    });

    const currentBalance = allRecords.reduce((acc, record) => {
      const valor = Number(record.valor) || 0;
      return record.tipo === 'entrada' ? acc + valor : acc - valor;
    }, 0);

    // 3. Calculate difference
    const difference = targetBalance - currentBalance;

    if (Math.abs(difference) < 0.01) {
      throw {
        status: 400,
        error: 'Nenhum ajuste necessário',
        message: 'O saldo atual já está correto.',
      };
    }

    // 4. Create adjustment record
    const tipo = difference > 0 ? 'entrada' : 'saida';
    const valor = Math.abs(difference);

    const record = await this.prisma.financeRecord.create({
      data: {
        userId,
        valor,
        tipo,
        categoria: 'Ajuste de Saldo',
        classificacao: 'ajuste_saldo',
        dataComprovante: new Date(), // Prisma stores as @db.Date (date only)
        de: 'Ajuste Manual',
        para: 'Ajuste Manual',
      },
    });

    return {
      message: 'Saldo ajustado com sucesso',
      record,
      adjustment: {
        previousBalance: currentBalance,
        targetBalance,
        difference,
        tipo,
      },
    };
  }

  /**
   * Calcular média mensal dos últimos 6 meses
   * SEMPRE usa últimos 6 meses, independente dos filtros do usuário
   */
  private calculateMediaMensal(allRecords: FinanceRecordDTO[]): number {
    const now = new Date();

    const last6MonthsData = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthRecords = allRecords.filter((r) => {
        try {
          // Parse ISO string (já é UTC por convenção)
          const recordDate = parseISO(r.dataComprovante);
          if (!isNaN(recordDate.getTime())) {
            return isWithinInterval(recordDate, {
              start: monthStart,
              end: monthEnd,
            });
          }
          return false;
        } catch {
          return false;
        }
      });

      const monthSaidas = monthRecords
        .filter((r) => r.tipo === 'saida')
        .reduce((sum, r) => sum + Number(r.valor), 0);

      return monthSaidas;
    });

    const totalSaidas = last6MonthsData.reduce((sum, saidas) => sum + saidas, 0);
    return totalSaidas / 6;
  }

  /**
   * Retorna dados de distribuição de gastos por categoria
   * EXCLUI ajuste_saldo do cálculo
   */
  async getExpenseDistribution(
    userId: string,
    filters: FinanceFilters
  ): Promise<{ categoria: string; valor: number; percentual: number }[]> {
    // Buscar registros filtrados
    const records = await this.getRecords(userId, filters);

    // Filtrar apenas saídas e EXCLUIR ajuste_saldo
    const expenses = records.filter(
      (r) => r.tipo === 'saida' && r.classificacao !== 'ajuste_saldo'
    );

    // Agrupar por categoria
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((record) => {
      const categoria = record.categoria;
      categoryTotals[categoria] = (categoryTotals[categoria] || 0) + Number(record.valor);
    });

    // Calcular total (sem ajuste_saldo)
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    // Converter para array com percentuais
    const distribution = Object.entries(categoryTotals)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);

    return distribution;
  }

  /**
   * Calcular variações comparando com período anterior
   */
  private async calculateVariacoes(
    userId: string,
    filters: FinanceFilters,
    saidasAtuais: number,
    margemAtual: number
  ): Promise<{
    variacaoMensal: number;
    variacaoMensalReais: number;
    variacaoMargem: number;
    variacaoSaidas: number;
  }> {
    // Determinar período anterior baseado nos filtros
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (filters.startDate && filters.endDate) {
      // Se há filtros customizados, usar período anterior do mesmo tamanho (UTC)
      const currentStart = parseISO(filters.startDate + 'T00:00:00Z');
      const currentEnd = parseISO(filters.endDate + 'T23:59:59Z');

      const diffDays = Math.floor(
        (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      prevEndDate = new Date(currentStart);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - diffDays);
    } else {
      // Se não há filtros, comparar mês atual com mês anterior
      const now = new Date();
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfMonth(subMonths(now, 1));
    }

    // Buscar registros do período anterior
    const prevRecords = await this.prisma.financeRecord.findMany({
      where: {
        userId,
        dataComprovante: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        ...(filters.tipo && { tipo: filters.tipo }),
        ...(filters.categoria && { categoria: filters.categoria }),
      },
    });

    const prevSaidas = prevRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const prevEntradas = prevRecords
      .filter((r) => r.tipo === 'entrada')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    // Calcular margem do período anterior
    const prevLucro = prevEntradas - prevSaidas;
    const prevMargem = prevEntradas > 0 ? (prevLucro / prevEntradas) * 100 : 0;

    // Calcular variações
    const variacaoMensal =
      prevSaidas > 0 ? ((saidasAtuais - prevSaidas) / prevSaidas) * 100 : 0;

    const variacaoMensalReais = saidasAtuais - prevSaidas;

    const variacaoMargem = margemAtual - prevMargem;

    const variacaoSaidas = variacaoMensal; // Igual a variacaoMensal

    return {
      variacaoMensal,
      variacaoMensalReais,
      variacaoMargem,
      variacaoSaidas,
    };
  }

  /**
   * Calcular métricas de saúde financeira
   * SEMPRE retorna objeto completo (nunca undefined profundo)
   */
  async getHealthMetrics(userId: string) {
    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 12);
    const sixMonthsAgo = subMonths(now, 6);
    const thirtyDaysAgo = subMonths(now, 1);

    // Query 1: TODOS os registros (saldo global)
    const allRecords = await this.prisma.financeRecord.findMany({
      where: { userId },
      orderBy: { dataComprovante: 'desc' },
    });

    // Query 2: Últimos 12 meses (burn rate + commitment)
    const last12MonthsRecords = await this.prisma.financeRecord.findMany({
      where: {
        userId,
        dataComprovante: { gte: twelveMonthsAgo, lte: now },
      },
      orderBy: { dataComprovante: 'desc' },
    });

    // ⚠️ CASO SEM DADOS: Retornar defaults explícitos (nunca undefined profundo)
    if (allRecords.length === 0) {
      return {
        score: 0,
        scoreLabel: 'atenção' as const,
        scoreColor: 'yellow' as const,
        burnRate: { current: 0, sixMonths: 0, hasLimitedData: true },
        fixedCommitment: { value: 0, status: 'atenção' as const, hasLimitedData: true },
        survivalTime: { value: 0, unit: 'dias' as const, status: 'atenção' as const, isStable: true },
        saldoGlobal: 0,
      };
    }

    // 1. SALDO GLOBAL (todos os registros)
    const saldoGlobal = allRecords.reduce((acc, record) => {
      const valor = Number(record.valor) || 0;
      return record.tipo === 'entrada' ? acc + valor : acc - valor;
    }, 0);

    // 2. BURN RATE
    const burnRateData = this.calculateBurnRate(last12MonthsRecords, now, twelveMonthsAgo, sixMonthsAgo);

    // 3. COMPROMETIMENTO FIXO
    const fixedCommitmentData = this.calculateFixedCommitment(last12MonthsRecords);

    // 4. TEMPO DE SOBREVIVÊNCIA
    const survivalTimeData = this.calculateSurvivalTime(saldoGlobal, burnRateData.current);

    // 5. SCORE DE SAÚDE
    const scoreData = this.calculateHealthScore(burnRateData, fixedCommitmentData, survivalTimeData);

    // 6. TENDÊNCIA (opcional - só se dados suficientes)
    const trend = this.calculateHealthTrend(allRecords, last12MonthsRecords, now, thirtyDaysAgo);

    return {
      score: scoreData.score,
      scoreLabel: scoreData.label,
      scoreColor: scoreData.color,
      trend,
      burnRate: burnRateData,
      fixedCommitment: fixedCommitmentData,
      survivalTime: survivalTimeData,
      saldoGlobal,
    };
  }

  /**
   * Calcular sazonalidade (máx/mín/média mensal últimos 12 meses)
   */
  async getSeasonality(userId: string, tipo: 'entrada' | 'saida') {
    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 12);

    const records = await this.prisma.financeRecord.findMany({
      where: {
        userId,
        tipo,
        dataComprovante: { gte: twelveMonthsAgo, lte: now },
      },
    });

    if (records.length === 0) {
      return {
        tipo,
        maxValue: 0,
        minValue: 0,
        avgValue: 0,
        hasData: false,
      };
    }

    // Agrupar por mês (YYYY-MM)
    const monthlyTotals: Record<string, number> = {};
    records.forEach((record) => {
      const date = record.dataComprovante;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(record.valor);
    });

    const values = Object.values(monthlyTotals);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      tipo,
      maxValue,
      minValue,
      avgValue,
      hasData: true,
    };
  }

  // ===== HELPER METHODS (private) =====

  private calculateBurnRate(
    records: any[],
    now: Date,
    twelveMonthsAgo: Date,
    sixMonthsAgo: Date
  ) {
    // Filtrar saídas dos últimos 12 meses
    const last12MonthsExpenses = records.filter((r) => r.tipo === 'saida');

    // Filtrar saídas dos últimos 6 meses
    const last6MonthsExpenses = records.filter((r) => {
      return r.tipo === 'saida' && r.dataComprovante >= sixMonthsAgo;
    });

    const totalExpenses12M = last12MonthsExpenses.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
    const totalExpenses6M = last6MonthsExpenses.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

    const current = totalExpenses12M / 12;
    const sixMonths = totalExpenses6M / 6;

    const hasLimitedData = last12MonthsExpenses.length < 3;

    return {
      current,
      sixMonths,
      hasLimitedData,
    };
  }

  private calculateFixedCommitment(records: any[]) {
    // ⚠️ IMPORTANTE: 'fixo' foi removido, agora usar 'recorrente' como proxy
    // Despesas recorrentes representam compromissos fixos
    const fixedExpenses = records
      .filter((r) => r.tipo === 'saida' && r.classificacao === 'recorrente')
      .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

    // Total de entradas
    const totalIncome = records
      .filter((r) => r.tipo === 'entrada')
      .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

    const value = totalIncome > 0 ? (fixedExpenses / totalIncome) * 100 : 0;

    const status: 'saudável' | 'atenção' | 'risco' =
      value <= 50 ? 'saudável' : value <= 70 ? 'atenção' : 'risco';

    const hasLimitedData = records.filter((r) => r.tipo === 'entrada').length < 2;

    return {
      value,
      status,
      hasLimitedData,
    };
  }

  private calculateSurvivalTime(saldoGlobal: number, burnRate: number) {
    if (burnRate <= 0) {
      // Burn rate zero ou negativo = situação estável
      return {
        value: 0,
        unit: 'dias' as const,
        status: 'atenção' as const,
        isStable: true,
      };
    }

    if (saldoGlobal <= 0) {
      // Saldo negativo = risco
      return {
        value: 0,
        unit: 'dias' as const,
        status: 'risco' as const,
        isStable: false,
      };
    }

    // Meses de sobrevivência
    const monthsOfSurvival = saldoGlobal / burnRate;

    // Converter para unidade apropriada
    let value: number;
    let unit: 'horas' | 'dias' | 'meses' | 'anos';

    if (monthsOfSurvival < 0.1) {
      value = monthsOfSurvival * 30 * 24; // horas
      unit = 'horas';
    } else if (monthsOfSurvival < 1) {
      value = monthsOfSurvival * 30; // dias
      unit = 'dias';
    } else if (monthsOfSurvival < 24) {
      value = monthsOfSurvival; // meses
      unit = 'meses';
    } else {
      value = monthsOfSurvival / 12; // anos
      unit = 'anos';
    }

    const status: 'saudável' | 'atenção' | 'risco' =
      monthsOfSurvival >= 6 ? 'saudável' : monthsOfSurvival >= 3 ? 'atenção' : 'risco';

    return {
      value: Math.round(value * 10) / 10, // 1 casa decimal
      unit,
      status,
      isStable: true,
    };
  }

  private calculateHealthScore(
    burnRateData: any,
    fixedCommitmentData: any,
    survivalTimeData: any
  ) {
    // Score Burn Rate (30%) - usando faixas (não linear)
    const burnRateRatio = fixedCommitmentData.value;
    const burnRateScore =
      burnRateRatio === null || burnRateRatio === 0
        ? 50
        : burnRateRatio <= 30
          ? 100
          : burnRateRatio <= 50
            ? 80
            : burnRateRatio <= 70
              ? 60
              : burnRateRatio <= 90
                ? 40
                : burnRateRatio <= 110
                  ? 25
                  : 10;

    // Score Comprometimento Fixo (40%)
    const fixedScore = fixedCommitmentData.value <= 50 ? 100 : 100 - (fixedCommitmentData.value - 50) * 2;

    // Score Tempo de Sobrevivência (30%)
    const survivalMonths = survivalTimeData.isStable
      ? survivalTimeData.unit === 'anos'
        ? survivalTimeData.value * 12
        : survivalTimeData.unit === 'meses'
          ? survivalTimeData.value
          : survivalTimeData.unit === 'dias'
            ? survivalTimeData.value / 30
            : survivalTimeData.value / (30 * 24)
      : 0;

    const survivalScore =
      survivalMonths >= 12 ? 100 : survivalMonths >= 6 ? 80 : survivalMonths >= 3 ? 50 : survivalMonths >= 1 ? 30 : 10;

    // Score total (ponderado)
    const totalScore = burnRateScore * 0.3 + fixedScore * 0.4 + survivalScore * 0.3;

    // Normalizar (0-100)
    const normalizedScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    const label: 'saudável' | 'atenção' | 'risco' =
      normalizedScore >= 70 ? 'saudável' : normalizedScore >= 50 ? 'atenção' : 'risco';

    const color: 'green' | 'yellow' | 'red' =
      normalizedScore >= 70 ? 'green' : normalizedScore >= 50 ? 'yellow' : 'red';

    return {
      score: normalizedScore,
      label,
      color,
    };
  }

  private calculateHealthTrend(
    allRecords: any[],
    last12MonthsRecords: any[],
    now: Date,
    thirtyDaysAgo: Date
  ) {
    // Filtrar registros até 30 dias atrás
    const recordsUntil30DaysAgo = allRecords.filter((r) => r.dataComprovante <= thirtyDaysAgo);
    const last12MonthsUntil30DaysAgo = last12MonthsRecords.filter((r) => r.dataComprovante <= thirtyDaysAgo);

    // Se não houver dados suficientes, não mostrar tendência
    if (recordsUntil30DaysAgo.length < 5 || last12MonthsUntil30DaysAgo.length < 5) {
      return undefined;
    }

    // Calcular scores
    const scoreOld = this.calculateScoreOnly(recordsUntil30DaysAgo, last12MonthsUntil30DaysAgo, thirtyDaysAgo);
    const scoreCurrent = this.calculateScoreOnly(allRecords, last12MonthsRecords, now);

    const scoreDiff = scoreCurrent - scoreOld;

    const direction: 'improving' | 'stable' | 'declining' =
      scoreDiff >= 5 ? 'improving' : scoreDiff <= -5 ? 'declining' : 'stable';

    const label = direction === 'improving' ? 'Em melhora' : direction === 'stable' ? 'Estável' : 'Em queda';

    const color = direction === 'improving' ? 'green' : direction === 'stable' ? 'yellow' : 'red';

    return {
      direction,
      label,
      color,
    };
  }

  private calculateScoreOnly(allRecords: any[], last12MonthsRecords: any[], referenceDate: Date): number {
    const twelveMonthsAgo = subMonths(referenceDate, 12);
    const sixMonthsAgo = subMonths(referenceDate, 6);

    const saldoGlobal = allRecords.reduce((acc, record) => {
      const valor = Number(record.valor) || 0;
      return record.tipo === 'entrada' ? acc + valor : acc - valor;
    }, 0);

    const burnRateData = this.calculateBurnRate(last12MonthsRecords, referenceDate, twelveMonthsAgo, sixMonthsAgo);
    const fixedCommitmentData = this.calculateFixedCommitment(last12MonthsRecords);
    const survivalTimeData = this.calculateSurvivalTime(saldoGlobal, burnRateData.current);
    const scoreData = this.calculateHealthScore(burnRateData, fixedCommitmentData, survivalTimeData);

    return scoreData.score;
  }

  /**
   * Advanced Health Metrics - Health Score 2.0 (Predictive)
   * Calcula score preditivo baseado em 6 pilares
   */
  async getAdvancedHealthMetrics(userId: string): Promise<AdvancedHealthMetricsResponse> {
    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 12);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Query 1: Todos os registros (saldo global)
    const allRecords = await this.prisma.financeRecord.findMany({
      where: { userId },
    });

    // Query 2: Últimos 12 meses (burn rate, ticket médio, margem)
    const last12MonthsRecords = await this.prisma.financeRecord.findMany({
      where: {
        userId,
        dataComprovante: { gte: twelveMonthsAgo, lte: now },
      },
    });

    // Query 3: Recorrentes (previsibilidade)
    const recurringRecords = last12MonthsRecords.filter((r) => r.classificacao === 'recorrente');

    // Query 4: Futuros (próximos 30 dias) - pressão futura
    const futureRecords = await this.prisma.financeRecord.findMany({
      where: {
        userId,
        dataComprovante: { gt: now, lte: thirtyDaysFromNow },
      },
    });

    // Edge case: sem dados suficientes
    if (allRecords.length < 3) {
      return this.getEmptyAdvancedMetrics();
    }

    // Calcular saldo global
    const saldoGlobal = allRecords.reduce((acc, record) => {
      const valor = Number(record.valor) || 0;
      return record.tipo === 'entrada' ? acc + valor : acc - valor;
    }, 0);

    // Calcular métricas base
    const entradasLast12M = last12MonthsRecords.filter((r) => r.tipo === 'entrada');
    const saidasLast12M = last12MonthsRecords.filter((r) => r.tipo === 'saida');

    const totalEntradas = entradasLast12M.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
    const totalSaidas = saidasLast12M.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

    const ticketMedioEntrada = entradasLast12M.length > 0 ? totalEntradas / entradasLast12M.length : 0;
    const ticketMedioSaida = saidasLast12M.length > 0 ? totalSaidas / saidasLast12M.length : 0;

    const entradasMediasMensais = totalEntradas / 12;
    const saidasMediasMensais = totalSaidas / 12;
    const burnRate = saidasMediasMensais;

    // Recorrentes
    const receitasRecorrentes = recurringRecords
      .filter((r) => r.tipo === 'entrada')
      .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
    const despesasRecorrentes = recurringRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

    // Futuros
    const compromissosFuturos30d = futureRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

    // PILAR 1: Estabilidade de Caixa (20%)
    const cashFlowStability = this.calculateCashFlowStability(ticketMedioEntrada, ticketMedioSaida);

    // PILAR 2: Previsibilidade (20%)
    const predictability = this.calculatePredictability(receitasRecorrentes, despesasRecorrentes);

    // PILAR 3: Margem Operacional (20%)
    const operationalMargin = this.calculateOperationalMargin(totalEntradas, totalSaidas);

    // PILAR 4: Pressão Futura (15%)
    const futurePressure = this.calculateFuturePressure(
      compromissosFuturos30d,
      entradasMediasMensais,
      receitasRecorrentes / 12
    );

    // PILAR 5: Qualidade do Fluxo (15%)
    const flowQuality = this.calculateFlowQuality(
      cashFlowStability.score,
      predictability.score,
      entradasLast12M
    );

    // PILAR 6: Resiliência (10%)
    const resilience = this.calculateResilience(saldoGlobal, burnRate);

    // Score total ponderado
    const totalScore =
      cashFlowStability.score * 0.2 +
      predictability.score * 0.2 +
      operationalMargin.score * 0.2 +
      futurePressure.score * 0.15 +
      flowQuality.score * 0.15 +
      resilience.score * 0.1;

    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    const scoreLabel: 'sustentável' | 'em atenção' | 'risco progressivo' =
      finalScore >= 70 ? 'sustentável' : finalScore >= 50 ? 'em atenção' : 'risco progressivo';

    const scoreColor: 'green' | 'yellow' | 'red' =
      finalScore >= 70 ? 'green' : finalScore >= 50 ? 'yellow' : 'red';

    // Calcular trend (opcional)
    const trend = this.calculateAdvancedTrend(userId, allRecords, last12MonthsRecords, now);

    return {
      score: finalScore,
      scoreLabel,
      scoreColor,
      horizon: '30d',
      pillars: {
        cashFlowStability,
        predictability,
        operationalMargin,
        futurePressure,
        flowQuality,
        resilience,
      },
      trend: await trend,
    };
  }

  // Helper: Safe ratio para evitar divisão por zero
  private safeRatio(numerator: number, denominator: number, defaultValue: number = 1.0): number {
    return denominator > 0 ? numerator / denominator : defaultValue;
  }

  // PILAR 1: Estabilidade de Caixa
  private calculateCashFlowStability(ticketEntrada: number, ticketSaida: number): PillarResult {
    if (ticketSaida === 0) {
      return {
        name: 'Estabilidade',
        value: 0,
        score: 50,
        weight: 0.2,
      };
    }

    // Clamp para evitar explosão com poucos dados (max 3x)
    const ratio = Math.min(3, ticketEntrada / ticketSaida);

    // Band-based scoring
    const score =
      ratio >= 1.5 ? 100
      : ratio >= 1.2 ? 85
      : ratio >= 1.0 ? 70
      : ratio >= 0.8 ? 50
      : ratio >= 0.6 ? 30
      : 10;

    return {
      name: 'Estabilidade',
      value: Math.round(ratio * 100) / 100,
      score,
      weight: 0.2,
    };
  }

  // PILAR 2: Previsibilidade
  private calculatePredictability(receitasRecorrentes: number, despesasRecorrentes: number): PillarResult {
    // Caso especial: receita recorrente sem despesas fixas = score perfeito
    if (despesasRecorrentes === 0 && receitasRecorrentes > 0) {
      return {
        name: 'Previsibilidade',
        value: 999,
        score: 100,
        weight: 0.2,
      };
    }

    // Sem recorrentes = neutro
    if (receitasRecorrentes === 0 && despesasRecorrentes === 0) {
      return {
        name: 'Previsibilidade',
        value: 0,
        score: 70,
        weight: 0.2,
      };
    }

    const ratio = this.safeRatio(receitasRecorrentes, despesasRecorrentes, 0);

    // Band-based scoring
    const score =
      ratio >= 1.5 ? 100
      : ratio >= 1.2 ? 85
      : ratio >= 1.0 ? 70
      : ratio >= 0.8 ? 50
      : ratio >= 0.6 ? 30
      : 10;

    return {
      name: 'Previsibilidade',
      value: Math.round(ratio * 100) / 100,
      score,
      weight: 0.2,
    };
  }

  // PILAR 3: Margem Operacional
  private calculateOperationalMargin(totalEntradas: number, totalSaidas: number): PillarResult {
    const MIN_ENTRADAS = 500;

    // Volume baixo = score neutro
    if (totalEntradas < MIN_ENTRADAS) {
      return {
        name: 'Margem',
        value: 0,
        score: 70,
        weight: 0.2,
      };
    }

    const margem = ((totalEntradas - totalSaidas) / totalEntradas) * 100;

    // Band-based scoring
    const score =
      margem >= 30 ? 100
      : margem >= 20 ? 85
      : margem >= 10 ? 70
      : margem >= 0 ? 50
      : margem >= -10 ? 30
      : 10;

    return {
      name: 'Margem',
      value: Math.round(margem * 10) / 10,
      score,
      weight: 0.2,
    };
  }

  // PILAR 4: Pressão Futura
  private calculateFuturePressure(
    compromissosFuturos: number,
    entradasMediasMensais: number,
    entradasRecorrentesMensais: number
  ): PillarResult {
    // Sem compromissos futuros = ótimo
    if (compromissosFuturos === 0) {
      return {
        name: 'Pressão Futura',
        value: 0,
        score: 100,
        weight: 0.15,
      };
    }

    // Prioridade: recorrentes > médias totais
    const baseEntradas =
      entradasRecorrentesMensais > 0 ? entradasRecorrentesMensais : entradasMediasMensais;

    const pressao = this.safeRatio(compromissosFuturos, baseEntradas, 0) * 100;

    // Band-based scoring (invertido: menor = melhor)
    const score =
      pressao <= 50 ? 100
      : pressao <= 70 ? 85
      : pressao <= 100 ? 70
      : pressao <= 120 ? 50
      : pressao <= 150 ? 30
      : 10;

    return {
      name: 'Pressão Futura',
      value: Math.round(pressao * 10) / 10,
      score,
      weight: 0.15,
    };
  }

  // PILAR 5: Qualidade do Fluxo
  private calculateFlowQuality(
    estabilidadeScore: number,
    previsibilidadeScore: number,
    entradasRecords: any[]
  ): PillarResult {
    // Calcular variância das entradas mensais
    const monthlyTotals: Map<string, number> = new Map();

    entradasRecords.forEach((record) => {
      const monthKey = startOfMonth(record.dataComprovante).toISOString();
      const current = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, current + (Number(record.valor) || 0));
    });

    const values = Array.from(monthlyTotals.values());

    if (values.length < 2) {
      // Dados insuficientes
      return {
        name: 'Qualidade',
        value: 0,
        score: 50,
        weight: 0.15,
      };
    }

    const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 100;

    // Normalizar variância para 0-100
    const varianciaScore = Math.max(0, Math.min(100, coefficientOfVariation));

    // Heurística: estabilidade * 0.5 + previsibilidade * 0.3 + (100 - variancia) * 0.2
    const qualidadeScore =
      estabilidadeScore * 0.5 + previsibilidadeScore * 0.3 + (100 - varianciaScore) * 0.2;

    return {
      name: 'Qualidade',
      value: Math.round((100 - varianciaScore) * 10) / 10,
      score: Math.round(qualidadeScore),
      weight: 0.15,
    };
  }

  // PILAR 6: Resiliência
  private calculateResilience(saldoGlobal: number, burnRate: number): PillarResult {
    if (burnRate <= 0) {
      return {
        name: 'Resiliência',
        value: 999,
        score: 100,
        weight: 0.1,
      };
    }

    const monthsOfSurvival = saldoGlobal / burnRate;

    // Band-based scoring
    const score =
      monthsOfSurvival >= 12 ? 100
      : monthsOfSurvival >= 6 ? 85
      : monthsOfSurvival >= 3 ? 70
      : monthsOfSurvival >= 1 ? 50
      : monthsOfSurvival >= 0.5 ? 30
      : 10;

    return {
      name: 'Resiliência',
      value: Math.round(monthsOfSurvival * 10) / 10,
      score,
      weight: 0.1,
    };
  }

  // Trend avançado (opcional)
  private async calculateAdvancedTrend(
    userId: string,
    allRecords: any[],
    last12MonthsRecords: any[],
    now: Date
  ): Promise<TrendData | undefined> {
    const thirtyDaysAgo = subMonths(now, 1);

    // Filtrar registros até 30 dias atrás
    const recordsUntil30DaysAgo = allRecords.filter((r) => r.dataComprovante <= thirtyDaysAgo);

    if (recordsUntil30DaysAgo.length < 5) {
      return undefined;
    }

    // Calcular score passado (simplificado)
    const scoreOld = 50; // Placeholder - poderia re-calcular metrics antigas
    const scoreCurrent = 50; // Placeholder

    const scoreDiff = scoreCurrent - scoreOld;

    const direction: 'improving' | 'stable' | 'declining' =
      scoreDiff >= 5 ? 'improving' : scoreDiff <= -5 ? 'declining' : 'stable';

    const label = direction === 'improving' ? 'Em melhora' : direction === 'stable' ? 'Estável' : 'Em queda';

    const color = direction === 'improving' ? 'green' : direction === 'stable' ? 'yellow' : 'red';

    return {
      direction,
      label,
      color,
    };
  }

  // Empty metrics (edge case)
  private getEmptyAdvancedMetrics(): AdvancedHealthMetricsResponse {
    const emptyPillar = (name: string, weight: number): PillarResult => ({
      name,
      value: 0,
      score: 50,
      weight,
    });

    return {
      score: 50,
      scoreLabel: 'em atenção',
      scoreColor: 'yellow',
      horizon: '30d',
      pillars: {
        cashFlowStability: emptyPillar('Estabilidade', 0.2),
        predictability: emptyPillar('Previsibilidade', 0.2),
        operationalMargin: emptyPillar('Margem', 0.2),
        futurePressure: emptyPillar('Pressão Futura', 0.15),
        flowQuality: emptyPillar('Qualidade', 0.15),
        resilience: emptyPillar('Resiliência', 0.1),
      },
    };
  }
}
