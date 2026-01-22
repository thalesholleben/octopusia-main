import { Activity, TrendingDown, Lock, Clock, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthMetrics } from '@/hooks/useHealthMetrics';

interface FinancialHealthCardProps {
  metrics: HealthMetrics | null;
  isLoading: boolean;
  hasData: boolean;
}

export function FinancialHealthCard({ metrics, isLoading, hasData }: FinancialHealthCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="mb-6 sm:mb-8">
      <div
        className="card-float p-4 sm:p-6 opacity-0 animate-fade-up"
        style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Saúde Financeira</h2>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-muted/30 rounded-lg p-4 border border-border/50 animate-pulse"
              >
                <div className="h-4 bg-muted rounded mb-3 w-20" />
                <div className="h-8 bg-muted rounded mb-2" />
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : hasData && metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Sub-card 1: Score */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              {/* Header com ícone e tendência */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Score</span>
                </div>
                {/* Badge de tendência (opcional) */}
                {metrics.trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                      metrics.trend.color === 'green' && 'bg-green-500/10 text-green-500',
                      metrics.trend.color === 'yellow' && 'bg-amber-500/10 text-amber-500',
                      metrics.trend.color === 'red' && 'bg-red-500/10 text-red-500'
                    )}
                  >
                    {metrics.trend.direction === 'improving' && <TrendingUp className="w-3 h-3" />}
                    {metrics.trend.direction === 'declining' && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {metrics.trend.direction === 'stable' && <Minus className="w-3 h-3" />}
                    <span>{metrics.trend.label}</span>
                  </div>
                )}
              </div>

              {/* Score value */}
              <div className="flex flex-col items-center gap-2 mb-3">
                <div
                  className={cn(
                    'text-4xl sm:text-5xl font-bold',
                    metrics.scoreColor === 'green' && 'text-green-500',
                    metrics.scoreColor === 'yellow' && 'text-amber-500',
                    metrics.scoreColor === 'red' && 'text-red-500'
                  )}
                >
                  {metrics.score.toFixed(0)}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium capitalize',
                    metrics.scoreColor === 'green' && 'text-green-500',
                    metrics.scoreColor === 'yellow' && 'text-amber-500',
                    metrics.scoreColor === 'red' && 'text-red-500'
                  )}
                >
                  {metrics.scoreLabel}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    metrics.scoreColor === 'green' && 'bg-green-500',
                    metrics.scoreColor === 'yellow' && 'bg-amber-500',
                    metrics.scoreColor === 'red' && 'bg-red-500'
                  )}
                  style={{ width: `${metrics.score}%` }}
                />
              </div>
            </div>

            {/* Sub-card 2: Burn Rate */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Burn Rate</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {formatCurrency(metrics.burnRate.current)}
                </div>
                <div className="text-xs text-muted-foreground">
                  6 meses: {formatCurrency(metrics.burnRate.sixMonths)}
                </div>
                {metrics.burnRate.hasLimitedData && (
                  <span className="text-xs text-amber-500">Dados limitados</span>
                )}
              </div>
            </div>

            {/* Sub-card 3: Comprometimento Fixo */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Comprometimento Fixo</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {metrics.fixedCommitment.value.toFixed(1)}%
                </div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit capitalize',
                    metrics.fixedCommitment.status === 'saudável' &&
                      'bg-green-500/10 text-green-500',
                    metrics.fixedCommitment.status === 'atenção' &&
                      'bg-amber-500/10 text-amber-500',
                    metrics.fixedCommitment.status === 'risco' && 'bg-red-500/10 text-red-500'
                  )}
                >
                  {metrics.fixedCommitment.status}
                </span>
                {metrics.fixedCommitment.hasLimitedData && (
                  <span className="text-xs text-amber-500">Dados insuficientes</span>
                )}
              </div>
            </div>

            {/* Sub-card 4: Tempo de Sobrevivência */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tempo de Sobrevivência</span>
              </div>

              <div className="flex flex-col gap-2">
                {metrics.survivalTime.isStable ? (
                  <div className="text-2xl sm:text-3xl font-bold text-green-500">Estável</div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {metrics.survivalTime.value.toFixed(1)}{' '}
                      <span className="text-sm text-muted-foreground">
                        {metrics.survivalTime.unit}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit capitalize',
                        metrics.survivalTime.status === 'saudável' &&
                          'bg-green-500/10 text-green-500',
                        metrics.survivalTime.status === 'atenção' &&
                          'bg-amber-500/10 text-amber-500',
                        metrics.survivalTime.status === 'risco' && 'bg-red-500/10 text-red-500'
                      )}
                    >
                      {metrics.survivalTime.status}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Activity className="w-12 h-12 opacity-30" />
            <p className="text-sm">Sem dados suficientes para calcular saúde financeira</p>
          </div>
        )}
      </div>
    </div>
  );
}
