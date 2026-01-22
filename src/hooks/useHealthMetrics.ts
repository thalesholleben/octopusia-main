import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@/lib/api';
import { FinanceRecord } from '@/types/financial';
import { parseISO, isValid, subMonths, subDays, differenceInMonths, format } from 'date-fns';

export interface HealthMetrics {
  score: number; // 0-100
  scoreLabel: 'saudável' | 'atenção' | 'risco';
  scoreColor: 'green' | 'yellow' | 'red';
  trend?: {
    direction: 'improving' | 'stable' | 'declining';
    label: 'Em melhora' | 'Estável' | 'Em queda';
    color: 'green' | 'yellow' | 'red';
  };
  burnRate: {
    current: number; // média mensal últimos 12 meses
    sixMonths: number; // média mensal últimos 6 meses
    hasLimitedData: boolean;
  };
  fixedCommitment: {
    value: number; // percentual
    status: 'saudável' | 'atenção' | 'risco';
    hasLimitedData: boolean;
  };
  survivalTime: {
    value: number;
    unit: 'horas' | 'dias' | 'meses' | 'anos';
    status: 'saudável' | 'atenção' | 'risco';
    isStable: boolean;
  };
  saldoGlobal: number;
  isLoading: boolean;
  hasData: boolean;
}

export function useHealthMetrics() {
  // Query 1: TODOS os registros (para saldo global)
  const { data: allData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['finance-records-all-for-health'],
    queryFn: async () => {
      const response = await financeAPI.getRecords();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query 2: Últimos 12 meses (para burn rate e commitment)
  const { data: data12M, isLoading: isLoading12M } = useQuery({
    queryKey: ['finance-records-12m-for-health'],
    queryFn: async () => {
      const now = new Date();
      const twelveMonthsAgo = subMonths(now, 12);
      const response = await financeAPI.getRecords({
        startDate: format(twelveMonthsAgo, 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd'),
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const allRecords = allData?.records || [];
  const last12MonthsRecords = data12M?.records || [];

  const isLoading = isLoadingAll || isLoading12M;
  const hasData = allRecords.length > 0 || last12MonthsRecords.length > 0;

  // Calcular todas as métricas
  const metrics: HealthMetrics = calculateHealthMetrics(allRecords, last12MonthsRecords);

  return {
    metrics: {
      ...metrics,
      isLoading,
      hasData,
    },
    isLoading,
    hasData,
  };
}

function calculateHealthMetrics(
  allRecords: FinanceRecord[],
  last12MonthsRecords: FinanceRecord[]
): Omit<HealthMetrics, 'isLoading' | 'hasData'> {
  const now = new Date();

  // 1. SALDO GLOBAL (todos os registros)
  const saldoGlobal = allRecords.reduce((acc, record) => {
    const valor = Number(record.valor) || 0;
    return record.tipo === 'entrada' ? acc + valor : acc - valor;
  }, 0);

  // 2. BURN RATE (últimos 12 meses)
  const burnRateData = calculateBurnRate(last12MonthsRecords, now);

  // 3. ÍNDICE DE COMPROMETIMENTO FIXO (últimos 12 meses)
  const fixedCommitmentData = calculateFixedCommitment(last12MonthsRecords);

  // 4. TEMPO DE SOBREVIVÊNCIA
  const survivalTimeData = calculateSurvivalTime(saldoGlobal, burnRateData.current);

  // 5. CALCULAR SCORE DE SAÚDE (0-100)
  const scoreData = calculateHealthScore(burnRateData, fixedCommitmentData, survivalTimeData);

  // 6. CALCULAR TENDÊNCIA (opcional - comparar com score de 30 dias atrás)
  const trend = calculateTrend(allRecords, last12MonthsRecords, now);

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

function calculateBurnRate(records: FinanceRecord[], now: Date) {
  const twelveMonthsAgo = subMonths(now, 12);
  const sixMonthsAgo = subMonths(now, 6);

  // Filtrar saídas dos últimos 12 meses
  const last12MonthsExpenses = records.filter((record) => {
    if (record.tipo !== 'saida') return false;
    const date = parseISO(record.dataComprovante);
    return isValid(date) && date >= twelveMonthsAgo && date <= now;
  });

  // Filtrar saídas dos últimos 6 meses
  const last6MonthsExpenses = records.filter((record) => {
    if (record.tipo !== 'saida') return false;
    const date = parseISO(record.dataComprovante);
    return isValid(date) && date >= sixMonthsAgo && date <= now;
  });

  const totalExpenses12M = last12MonthsExpenses.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
  const totalExpenses6M = last6MonthsExpenses.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

  const monthsCount12M = Math.max(1, differenceInMonths(now, twelveMonthsAgo) || 12);
  const monthsCount6M = Math.max(1, differenceInMonths(now, sixMonthsAgo) || 6);

  const current = totalExpenses12M / monthsCount12M;
  const sixMonths = totalExpenses6M / monthsCount6M;

  const hasLimitedData = last12MonthsExpenses.length < 3; // menos de 3 registros nos últimos 12 meses

  return {
    current,
    sixMonths,
    hasLimitedData,
  };
}

function calculateFixedCommitment(records: FinanceRecord[]) {
  // Despesas fixas (classificacao = 'fixo')
  const fixedExpenses = records
    .filter((r) => r.tipo === 'saida' && r.classificacao === 'fixo')
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

function calculateSurvivalTime(saldoGlobal: number, burnRate: number) {
  if (burnRate <= 0 || saldoGlobal <= 0) {
    // Sem dados suficientes ou situação instável
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
    // Menos de 3 dias
    value = monthsOfSurvival * 30 * 24; // converter para horas
    unit = 'horas';
  } else if (monthsOfSurvival < 1) {
    // Menos de 1 mês
    value = monthsOfSurvival * 30; // converter para dias
    unit = 'dias';
  } else if (monthsOfSurvival < 24) {
    // Menos de 2 anos
    value = monthsOfSurvival;
    unit = 'meses';
  } else {
    // 2 anos ou mais
    value = monthsOfSurvival / 12;
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

function calculateHealthScore(
  burnRateData: ReturnType<typeof calculateBurnRate>,
  fixedCommitmentData: ReturnType<typeof calculateFixedCommitment>,
  survivalTimeData: ReturnType<typeof calculateSurvivalTime>
) {
  // Score Burn Rate (30%) - usando faixas (não linear)
  const burnRateRatio = fixedCommitmentData.value; // % de comprometimento como proxy
  const burnRateScore =
    burnRateRatio === null || burnRateRatio === 0
      ? 50 // neutro se não houver dados
      : burnRateRatio <= 30
        ? 100 // Excelente
        : burnRateRatio <= 50
          ? 80 // Bom
          : burnRateRatio <= 70
            ? 60 // Atenção
            : burnRateRatio <= 90
              ? 40 // Alerta
              : burnRateRatio <= 110
                ? 25 // Risco
                : 10; // Crítico (>110%)

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
          : survivalTimeData.value / (30 * 24) // horas
    : 0;

  const survivalScore =
    survivalMonths >= 12 ? 100 : survivalMonths >= 6 ? 80 : survivalMonths >= 3 ? 50 : survivalMonths >= 1 ? 30 : 10;

  // Score total (ponderado)
  const totalScore = burnRateScore * 0.3 + fixedScore * 0.4 + survivalScore * 0.3;

  // IMPORTANTE: Normalizar o score para garantir que fique no intervalo 0-100
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

// Função auxiliar para calcular apenas o score (sem tendência) - evita recursão
function calculateScoreOnly(allRecords: FinanceRecord[], last12MonthsRecords: FinanceRecord[], now: Date): number {
  const saldoGlobal = allRecords.reduce((acc, record) => {
    const valor = Number(record.valor) || 0;
    return record.tipo === 'entrada' ? acc + valor : acc - valor;
  }, 0);

  const burnRateData = calculateBurnRate(last12MonthsRecords, now);
  const fixedCommitmentData = calculateFixedCommitment(last12MonthsRecords);
  const survivalTimeData = calculateSurvivalTime(saldoGlobal, burnRateData.current);
  const scoreData = calculateHealthScore(burnRateData, fixedCommitmentData, survivalTimeData);

  return scoreData.score;
}

function calculateTrend(allRecords: FinanceRecord[], last12MonthsRecords: FinanceRecord[], now: Date) {
  // Calcular score de 30 dias atrás
  const thirtyDaysAgo = subDays(now, 30);

  // Filtrar registros até 30 dias atrás
  const recordsUntil30DaysAgo = allRecords.filter((record) => {
    const date = parseISO(record.dataComprovante);
    return isValid(date) && date <= thirtyDaysAgo;
  });

  const last12MonthsUntil30DaysAgo = last12MonthsRecords.filter((record) => {
    const date = parseISO(record.dataComprovante);
    return isValid(date) && date <= thirtyDaysAgo;
  });

  // Se não houver dados suficientes, não mostrar tendência
  if (recordsUntil30DaysAgo.length < 5 || last12MonthsUntil30DaysAgo.length < 5) {
    return undefined;
  }

  // Calcular scores usando função sem recursão
  const scoreOld = calculateScoreOnly(recordsUntil30DaysAgo, last12MonthsUntil30DaysAgo, thirtyDaysAgo);
  const scoreCurrent = calculateScoreOnly(allRecords, last12MonthsRecords, now);

  const scoreDiff = scoreCurrent - scoreOld;

  // Definir direção
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
