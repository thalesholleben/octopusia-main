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
} from '../types/finance.types';

export class FinanceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calcula todos os KPIs financeiros
   */
  async getKPIs(
    userId: string,
    filters: FinanceFilters
  ): Promise<FinanceKPIs> {
    // Buscar registros filtrados (para cálculos que respeitam filtros)
    const filteredRecords = await this.getRecords(userId, filters);

    // Buscar TODOS os registros (para mediaMensal que ignora filtros)
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
    filters: FinanceFilters
  ): Promise<FinanceRecordDTO[]> {
    const where: any = { userId };

    // Aplicar filtros de data (UTC)
    if (filters.startDate || filters.endDate) {
      where.dataComprovante = {};
      if (filters.startDate) {
        // Parse como UTC: YYYY-MM-DD -> início do dia em UTC
        where.dataComprovante.gte = startOfDay(parseISO(filters.startDate + 'T00:00:00Z'));
      }
      if (filters.endDate) {
        // Parse como UTC: YYYY-MM-DD -> fim do dia em UTC
        where.dataComprovante.lte = endOfDay(parseISO(filters.endDate + 'T23:59:59Z'));
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
   */
  private async getAllRecords(userId: string): Promise<FinanceRecordDTO[]> {
    const records = await this.prisma.financeRecord.findMany({
      where: { userId },
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
}
