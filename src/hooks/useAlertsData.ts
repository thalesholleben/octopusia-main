import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI, AlertsPageResponse } from '@/lib/api';
import { useMemo } from 'react';
import { toast } from 'sonner';

export function useAlertsData() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['alertsPage'],
    queryFn: async () => {
      const response = await financeAPI.getAlertsPage();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Mutation for updating alert status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'concluido' | 'ignorado' }) =>
      financeAPI.updateAlertStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alertsPage'] });
      queryClient.invalidateQueries({ queryKey: ['goalAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });

      const message = variables.status === 'concluido'
        ? 'Alerta marcado como concluído'
        : 'Alerta ignorado';
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao atualizar alerta';
      toast.error(message);
    },
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
    updateAlertStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
