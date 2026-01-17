import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeAPI, type FinanceRecord, type AIAlert } from '@/lib/api';
import {
  startOfToday,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  isWithinInterval,
  format,
  isValid,
} from 'date-fns';
import type { DateFilterType } from '@/types/financial';

// Helper para criar data segura
const safeParseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

interface FilterOptions {
  filterType: DateFilterType;
  startDate?: Date;
  endDate?: Date;
  selectedClient?: string | null;
}

export const useFinancialData = (filters: FilterOptions) => {
  const { filterType, startDate, endDate, selectedClient } = filters;

  // Calcular range de datas com base no filtro
  const dateRange = useMemo(() => {
    const today = startOfToday();
    let start: Date;
    let end: Date = today;

    switch (filterType) {
      case 'today':
        start = today;
        break;
      case 'last7days':
        start = subDays(today, 7);
        break;
      case 'last30days':
        start = subDays(today, 30);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        break;
      case 'custom':
        if (!startDate || !endDate) {
          start = startOfMonth(today);
          end = today;
        } else {
          start = startDate;
          end = endDate;
        }
        break;
      default:
        start = startOfMonth(today);
    }

    return { start, end };
  }, [filterType, startDate, endDate]);

  // Buscar registros financeiros
  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
  } = useQuery({
    queryKey: ['financeRecords', dateRange.start, dateRange.end],
    queryFn: () =>
      financeAPI.getRecords({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      }),
    staleTime: 1000 * 30, // 30 segundos - dados ficam frescos por pouco tempo
    refetchInterval: 1000 * 60, // Refetch automático a cada 1 minuto
    refetchOnWindowFocus: true, // Atualiza quando volta para a aba
  });

  // Buscar alertas
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery({
    queryKey: ['aiAlerts'],
    queryFn: () => financeAPI.getAlerts(),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 3, // Refetch a cada 3 minutos
    refetchOnWindowFocus: true,
  });

  const records = recordsData?.data.records || [];
  const alerts = alertsData?.data.alerts || [];

  // Filtrar por cliente se selecionado
  const filteredRecords = useMemo(() => {
    if (!selectedClient) return records;
    return records.filter(
      (r) => r.de === selectedClient || r.para === selectedClient
    );
  }, [records, selectedClient]);

  // Calcular KPIs detalhados
  const kpis = useMemo(() => {
    const entradas = filteredRecords
      .filter((r) => r.tipo === 'entrada')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const saidas = filteredRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const saldo = entradas - saidas;

    // Calcular ticket médio
    const ticketMedio = filteredRecords.length > 0 ? saidas / filteredRecords.length : 0;

    // Calcular média mensal real (últimos 6 meses)
    const last6MonthsData = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthRecords = records.filter((r) => {
        const recordDate = safeParseDate(r.dataComprovante);
        if (!recordDate) return false;
        return isWithinInterval(recordDate, {
          start: monthStart,
          end: monthEnd,
        });
      });

      const monthSaidas = monthRecords
        .filter((r) => r.tipo === 'saida')
        .reduce((sum, r) => sum + Number(r.valor), 0);

      return { month: format(date, 'MMM/yy'), saidas: monthSaidas };
    });

    const mediaMensal = last6MonthsData.reduce((sum, m) => sum + m.saidas, 0) / 6;

    // Comparar com mês anterior para variação
    const prevMonthStart = subMonths(dateRange.start, 1);
    const prevMonthEnd = subMonths(dateRange.end, 1);

    const prevMonthRecords = records.filter((r) => {
      const recordDate = safeParseDate(r.dataComprovante);
      if (!recordDate) return false;
      return isWithinInterval(recordDate, {
        start: prevMonthStart,
        end: prevMonthEnd,
      });
    });

    const prevMonthSaidas = prevMonthRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const variacaoMensal =
      prevMonthSaidas > 0 ? ((saidas - prevMonthSaidas) / prevMonthSaidas) * 100 : 0;

    return {
      saldo,
      entradas,
      saidas,
      ticketMedio,
      variacaoMensal,
      totalTransacoes: filteredRecords.length,
      mediaMensal,
    };
  }, [filteredRecords, dateRange, records]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Agrupar por categoria para o gráfico de pizza
    const categoryCounts = filteredRecords
      .filter((r) => r.tipo === 'saida')
      .reduce((acc, r) => {
        acc[r.categoria] = (acc[r.categoria] || 0) + Number(r.valor);
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Evolução temporal (agrupado por data)
    const evolutionData = filteredRecords.reduce((acc, r) => {
      const recordDate = safeParseDate(r.dataComprovante);
      if (!recordDate) return acc;

      const date = format(recordDate, 'dd/MM');
      if (!acc[date]) {
        acc[date] = { date, entradas: 0, saidas: 0 };
      }
      if (r.tipo === 'entrada') {
        acc[date].entradas += Number(r.valor);
      } else {
        acc[date].saidas += Number(r.valor);
      }
      return acc;
    }, {} as Record<string, { date: string; entradas: number; saidas: number }>);

    const timelineData = Object.values(evolutionData).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      categoryData,
      timelineData,
    };
  }, [filteredRecords]);

  return {
    records: filteredRecords,
    alerts,
    kpis,
    chartData,
    isLoading: recordsLoading || alertsLoading,
    error: recordsError || alertsError,
  };
};
