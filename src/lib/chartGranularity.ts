import {
  parseISO,
  isValid,
  differenceInDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  format,
  getQuarter,
  getYear,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinanceRecord } from '@/types/financial';
import { GranularityType } from '@/types/chartGranularity';

/**
 * Parse seguro de string para Date
 * Retorna null se a data for inválida
 */
export const safeParseDateStr = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Calcula o range de datas dos registros
 */
export function getDateRangeFromRecords(records: FinanceRecord[]): {
  minDate: Date | null;
  maxDate: Date | null;
  daysDiff: number;
} {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  records.forEach(record => {
    const date = safeParseDateStr(record.dataComprovante);
    if (!date) return;

    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
  });

  const daysDiff = minDate && maxDate
    ? differenceInDays(maxDate, minDate) + 1
    : 0;

  return { minDate, maxDate, daysDiff };
}

/**
 * Determina a granularidade ideal baseado no range de datas
 * - 1-7 dias → diário
 * - 8-60 dias → semanal
 * - 61-365 dias → mensal
 * - 365+ dias → trimestral
 */
export function determineGranularity(daysDiff: number): GranularityType {
  if (daysDiff <= 7) return 'daily';
  if (daysDiff <= 60) return 'weekly';
  if (daysDiff <= 365) return 'monthly';
  return 'quarterly';
}

/**
 * Gera a chave de agrupamento para uma data baseado na granularidade
 */
export function getGroupKey(date: Date, granularity: GranularityType): string {
  switch (granularity) {
    case 'daily':
      return format(date, 'yyyy-MM-dd');
    case 'weekly': {
      // Usa o início da semana (domingo) como chave
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      return format(weekStart, 'yyyy-MM-dd');
    }
    case 'monthly':
      return format(date, 'yyyy-MM');
    case 'quarterly':
      return `${getYear(date)}-Q${getQuarter(date)}`;
  }
}

/**
 * Formata o label para exibição no X-axis baseado na granularidade
 */
export function formatAxisLabel(groupKey: string, granularity: GranularityType): string {
  try {
    switch (granularity) {
      case 'daily': {
        const date = parseISO(groupKey);
        return isValid(date) ? format(date, 'dd MMM', { locale: ptBR }) : groupKey;
      }
      case 'weekly': {
        const date = parseISO(groupKey);
        return isValid(date) ? format(date, "'Sem' dd/MM", { locale: ptBR }) : groupKey;
      }
      case 'monthly': {
        const date = parseISO(`${groupKey}-01`);
        return isValid(date) ? format(date, 'MMM/yy', { locale: ptBR }) : groupKey;
      }
      case 'quarterly': {
        // Formato: "2024-Q1" → "1T 2024"
        const [year, quarter] = groupKey.split('-Q');
        return `${quarter}T ${year}`;
      }
    }
  } catch {
    return groupKey;
  }
}

/**
 * Determina se deve mostrar dots baseado na densidade de pontos
 * Mostra dots apenas quando há poucos pontos para melhor visualização
 */
export function shouldShowDots(dataPointCount: number): boolean {
  return dataPointCount < 15;
}

/**
 * Determina o tipo de curva baseado na densidade de pontos
 * - Muitos pontos: 'linear' para clareza
 * - Poucos pontos: 'monotone' para suavidade
 */
export function getCurveType(dataPointCount: number): 'linear' | 'monotone' {
  return dataPointCount > 20 ? 'linear' : 'monotone';
}

/**
 * Calcula o intervalo ideal para labels do X-axis
 * Evita sobreposição de labels quando há muitos pontos
 */
export function getXAxisInterval(dataPointCount: number): number | 'preserveStartEnd' {
  if (dataPointCount <= 10) return 0; // Mostra todos
  if (dataPointCount <= 20) return 'preserveStartEnd';
  return Math.floor(dataPointCount / 8); // ~8 labels visíveis
}

/**
 * Retorna o label curto para o badge de granularidade
 */
export function getGranularityShortLabel(granularity: GranularityType): string {
  const labels: Record<GranularityType, string> = {
    daily: 'D',
    weekly: 'S',
    monthly: 'M',
    quarterly: 'T',
  };
  return labels[granularity];
}

/**
 * Retorna o label completo para o tooltip/select de granularidade
 */
export function getGranularityLabel(granularity: GranularityType): string {
  const labels: Record<GranularityType, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
  };
  return labels[granularity];
}
