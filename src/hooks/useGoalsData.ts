import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsAPI, type FinancialGoal, type GoalStats, type GamificationData, type AIAlert } from '@/lib/api';
import { toast } from 'sonner';

interface GoalFilters {
  status?: 'ativo' | 'pausado' | 'concluido' | 'falhou';
  period?: 'mensal' | 'trimestral' | 'anual' | 'personalizado';
}

export const useGoalsData = (filters: GoalFilters = {}) => {
  const queryClient = useQueryClient();

  // Fetch goals
  const {
    data: goalsData,
    isLoading: goalsLoading,
    error: goalsError,
  } = useQuery({
    queryKey: ['goals', filters],
    queryFn: () => goalsAPI.getGoals(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
  });

  // Fetch goal stats
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['goalStats'],
    queryFn: () => goalsAPI.getStats(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  // Fetch gamification data
  const {
    data: gamificationData,
    isLoading: gamificationLoading,
    error: gamificationError,
  } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => goalsAPI.getGamification(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch goal-specific alerts
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery({
    queryKey: ['goalAlerts'],
    queryFn: () => goalsAPI.getAlerts(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 3, // Refetch every 3 minutes
    refetchOnWindowFocus: true,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: goalsAPI.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalStats'] });
      toast.success('Meta criada com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao criar meta';
      toast.error(message);
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsAPI.updateGoal>[1] }) =>
      goalsAPI.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalStats'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao atualizar meta';
      toast.error(message);
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: goalsAPI.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalStats'] });
      toast.success('Meta excluída com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao excluir meta';
      toast.error(message);
    },
  });

  // Sync progress mutation
  const syncProgressMutation = useMutation({
    mutationFn: goalsAPI.syncProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalStats'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success('Progresso sincronizado!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao sincronizar progresso';
      toast.error(message);
    },
  });

  const goals = goalsData?.data.goals || [];
  const stats = statsData?.data || null;
  const gamification = gamificationData?.data || null;
  const alerts = alertsData?.data.alerts || [];

  // Computed: goals at risk
  const atRiskGoals = useMemo(() => {
    return goals.filter(goal => goal.atRisk);
  }, [goals]);

  // Computed: active goals
  const activeGoals = useMemo(() => {
    return goals.filter(goal => goal.status === 'ativo');
  }, [goals]);

  // Computed: completed goals
  const completedGoals = useMemo(() => {
    return goals.filter(goal => goal.status === 'concluido');
  }, [goals]);

  // Chart data: goal progress over categories
  const categoryChartData = useMemo(() => {
    const categoryGoals = goals.reduce((acc, goal) => {
      const category = goal.category || 'Sem categoria';
      if (!acc[category]) {
        acc[category] = { name: category, total: 0, completed: 0 };
      }
      acc[category].total += 1;
      if (goal.status === 'concluido') {
        acc[category].completed += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; total: number; completed: number }>);

    return Object.values(categoryGoals);
  }, [goals]);

  // Chart data: completion over time (last 6 months)
  const completionChartData = useMemo(() => {
    const last6Months: { month: string; completed: number; failed: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      const monthGoals = goals.filter(goal => {
        if (!goal.completedAt && goal.status !== 'falhou') return false;
        const goalDate = goal.completedAt ? new Date(goal.completedAt) : new Date(goal.endDate);
        return (
          goalDate.getMonth() === date.getMonth() &&
          goalDate.getFullYear() === date.getFullYear()
        );
      });

      last6Months.push({
        month: monthStr,
        completed: monthGoals.filter(g => g.status === 'concluido').length,
        failed: monthGoals.filter(g => g.status === 'falhou').length,
      });
    }

    return last6Months;
  }, [goals]);

  return {
    goals,
    activeGoals,
    completedGoals,
    atRiskGoals,
    stats,
    gamification,
    alerts,
    categoryChartData,
    completionChartData,
    isLoading: goalsLoading || statsLoading || gamificationLoading || alertsLoading,
    error: goalsError || statsError || gamificationError || alertsError,
    mutations: {
      createGoal: createGoalMutation.mutate,
      updateGoal: updateGoalMutation.mutate,
      deleteGoal: deleteGoalMutation.mutate,
      syncProgress: syncProgressMutation.mutate,
      isCreating: createGoalMutation.isPending,
      isUpdating: updateGoalMutation.isPending,
      isDeleting: deleteGoalMutation.isPending,
      isSyncing: syncProgressMutation.isPending,
    },
  };
};
