import { addDays, addMonths, addWeeks, addYears, startOfDay, isAfter } from 'date-fns';
import { randomUUID } from 'crypto';

// Constantes
export const RECURRENCE_CONSTANTS = {
  MIN_FUTURE_ITEMS: 2,
  BATCH_SIZE: 4,
};

// Tipos
export type RecurrenceInterval = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type RecurrenceDuration = '3_meses' | '6_meses' | '12_meses' | 'indefinido';

/**
 * Avança uma data de acordo com o intervalo de recorrência
 * @param date Data base
 * @param interval Intervalo de recorrência
 * @returns Próxima data no intervalo
 */
export function advanceDateByInterval(date: Date, interval: RecurrenceInterval): Date {
  switch (interval) {
    case 'semanal':
      return addWeeks(date, 1);
    case 'mensal':
      return addMonths(date, 1);
    case 'trimestral':
      return addMonths(date, 3);
    case 'semestral':
      return addMonths(date, 6);
    case 'anual':
      return addYears(date, 1);
    default:
      throw new Error(`Intervalo de recorrência inválido: ${interval}`);
  }
}

/**
 * Calcula a data final baseada na duração
 * @param startDate Data inicial
 * @param duration Duração da recorrência
 * @returns Data final ou null se indefinido
 */
export function calculateEndDate(startDate: Date, duration: RecurrenceDuration): Date | null {
  if (duration === 'indefinido') {
    return null;
  }

  switch (duration) {
    case '3_meses':
      return addMonths(startDate, 3);
    case '6_meses':
      return addMonths(startDate, 6);
    case '12_meses':
      return addMonths(startDate, 12);
    default:
      throw new Error(`Duração de recorrência inválida: ${duration}`);
  }
}

/**
 * Gera array de datas para recorrência
 * @param startDate Data inicial
 * @param interval Intervalo de recorrência
 * @param duration Duração da recorrência
 * @returns Array de datas
 */
export function generateRecurrenceDates(
  startDate: Date,
  interval: RecurrenceInterval,
  duration: RecurrenceDuration
): Date[] {
  const dates: Date[] = [startDate];
  const endDate = calculateEndDate(startDate, duration);

  // Para recorrências indefinidas, gerar apenas o buffer inicial
  if (!endDate) {
    let currentDate = startDate;
    for (let i = 0; i < RECURRENCE_CONSTANTS.BATCH_SIZE; i++) {
      currentDate = advanceDateByInterval(currentDate, interval);
      dates.push(currentDate);
    }
    return dates;
  }

  // Para recorrências com data final, gerar todas as datas
  let currentDate = startDate;
  while (currentDate <= endDate) {
    currentDate = advanceDateByInterval(currentDate, interval);
    if (currentDate <= endDate) {
      dates.push(currentDate);
    }
  }

  return dates;
}

/**
 * Verifica se uma data é futura (depois de hoje)
 * ⚠️ IMPORTANTE: Esta é a fonte de verdade para isFuture
 * @param date Data a verificar
 * @returns true se a data é futura
 */
export function isFutureDate(date: Date): boolean {
  const today = startOfDay(new Date());
  return isAfter(startOfDay(date), today);
}

/**
 * Gera um UUID v4 para identificar grupo de recorrência
 * @returns UUID v4
 */
export function generateRecurrenceGroupId(): string {
  return randomUUID();
}
