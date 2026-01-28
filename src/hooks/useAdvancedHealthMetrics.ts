import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@/lib/api';

/**
 * Hook para buscar métricas avançadas de saúde financeira (Health Score 2.0)
 * Usa cache de 5 minutos para evitar requisições excessivas
 */
export function useAdvancedHealthMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['finance', 'advanced-health-metrics'],
    queryFn: async () => {
      const response = await financeAPI.getAdvancedHealthMetrics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    metrics: data,
    isLoading,
    hasData: !!data,
    error,
  };
}
