import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@/lib/api';
import {
  startOfToday,
  startOfMonth,
  subDays,
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
      case 'last60days':
        start = subDays(today, 60);
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

  // Buscar KPIs, registros e alertas do backend (tudo em uma única query)
  const {
    data: summaryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financeSummary', dateRange.start, dateRange.end],
    queryFn: () =>
      financeAPI.getSummary({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      }),
    staleTime: 1000 * 30, // 30 segundos - dados ficam frescos por pouco tempo
    refetchInterval: 1000 * 60, // Refetch automático a cada 1 minuto
    refetchOnWindowFocus: true, // Atualiza quando volta para a aba
  });

  // KPIs vêm direto do backend (sem cálculo local)
  const kpis = summaryData?.data.kpis || {
    saldo: 0,
    entradas: 0,
    saidas: 0,
    lucroLiquido: 0,
    margemLiquida: 0,
    ticketMedio: 0,
    ticketMedioEntrada: 0,
    mediaMensal: 0,
    variacaoMensal: 0,
    variacaoMensalReais: 0,
    variacaoMargem: 0,
    variacaoSaidas: 0,
    totalTransacoes: 0,
  };

  const records = summaryData?.data.records || [];
  const alerts = summaryData?.data.alerts || [];

  // Filtrar por cliente se selecionado (filtro local apenas para UI)
  const filteredRecords = useMemo(() => {
    if (!selectedClient) return records;
    return records.filter(
      (r) => r.de === selectedClient || r.para === selectedClient
    );
  }, [records, selectedClient]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Agrupar por categoria para o gráfico de pizza (excluindo ajustes de saldo)
    const categoryCounts = filteredRecords
      .filter((r) => r.tipo === 'saida' && r.classificacao !== 'ajuste_saldo')
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
    kpis,      // KPIs vêm do backend, não calculados localmente
    chartData, // Apenas agregações para UI (gráficos)
    isLoading,
    error,
  };
};
