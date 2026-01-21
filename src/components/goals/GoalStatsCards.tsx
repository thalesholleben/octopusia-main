import { Target, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import type { GoalStats } from '@/lib/api';

interface GoalStatsCardsProps {
  stats: GoalStats | null;
  isLoading: boolean;
}

export function GoalStatsCards({ stats, isLoading }: GoalStatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="card-float p-3 sm:p-4 animate-pulse"
          >
            <div className="h-4 bg-secondary rounded w-20 mb-2" />
            <div className="h-6 bg-secondary rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <KPICard
        title="Metas Ativas"
        value={stats.active.toString()}
        icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
        variant="default"
        delay={150}
      />
      <KPICard
        title="Concluídas"
        value={stats.completed.toString()}
        icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
        variant="positive"
        delay={200}
      />
      <KPICard
        title="Em Risco"
        value={stats.atRisk.toString()}
        icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
        variant={stats.atRisk > 0 ? 'warning' : 'default'}
        delay={250}
      />
      <KPICard
        title="Taxa de Sucesso"
        value={`${stats.successRate}%`}
        icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
        variant={stats.successRate >= 70 ? 'positive' : stats.successRate >= 40 ? 'warning' : 'negative'}
        delay={300}
      />
    </div>
  );
}
