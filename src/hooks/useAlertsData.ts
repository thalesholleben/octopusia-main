import { useQuery } from '@tanstack/react-query';
import { financeAPI, AlertsPageResponse } from '@/lib/api';
import { useMemo } from 'react';

export function useAlertsData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alertsPage'],
    queryFn: async () => {
      const response = await financeAPI.getAlertsPage();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const pieChartData = useMemo(() => {
    if (!data?.stats.priorityCounts) return [];

    const { priorityCounts } = data.stats;
    const result = [];

    if (priorityCounts.alta > 0) {
      result.push({ name: 'Alta', value: priorityCounts.alta, fill: '#ef4444' });
    }
    if (priorityCounts.media > 0) {
      result.push({ name: 'Média', value: priorityCounts.media, fill: '#eab308' });
    }
    if (priorityCounts.baixa > 0) {
      result.push({ name: 'Baixa', value: priorityCounts.baixa, fill: '#22c55e' });
    }

    return result;
  }, [data]);

  const criticalPercentage = useMemo(() => {
    if (!data?.stats) return 0;
    const { totalAlerts, priorityCounts } = data.stats;
    if (totalAlerts === 0) return 0;
    return Math.round((priorityCounts.alta / totalAlerts) * 100);
  }, [data]);

  return {
    alerts: data?.alerts ?? [],
    stats: data?.stats ?? { totalAlerts: 0, priorityCounts: { alta: 0, media: 0, baixa: 0 } },
    criticalPercentage,
    pieChartData,
    isLoading,
    error,
  };
}
