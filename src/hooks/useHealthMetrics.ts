import { useQuery } from '@tanstack/react-query';
import { financeAPI, HealthMetricsResponse } from '@/lib/api';

export interface HealthMetrics extends HealthMetricsResponse {
  isLoading: boolean;
  hasData: boolean;
}

export function useHealthMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'health-metrics'],
    queryFn: async () => {
      const response = await financeAPI.getHealthMetrics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const hasData = data ? true : false;

  return {
    metrics: {
      ...data,
      isLoading,
      hasData,
    } as HealthMetrics,
    isLoading,
    hasData,
  };
}
