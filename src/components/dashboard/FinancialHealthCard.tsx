import { Activity, TrendingDown, Lock, Clock, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthMetrics } from '@/hooks/useHealthMetrics';

interface FinancialHealthCardProps {
  metrics: HealthMetrics | null;
  isLoading: boolean;
  hasData: boolean;
}

// Progress Ring Component
function ProgressRing({
  score,
  color,
  size = 160,
  strokeWidth = 10,
}: {
  score: number;
  color: 'green' | 'yellow' | 'red';
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const colorClasses = {
    green: 'stroke-green-500',
    yellow: 'stroke-amber-500',
    red: 'stroke-red-500',
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/50"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={cn(colorClasses[color], 'transition-all duration-700 ease-out')}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
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
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Saúde Financeira</h2>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : hasData && metrics ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Score Card - Destaque Principal */}
            <div className="lg:col-span-5 bg-muted/30 rounded-lg p-4 sm:p-6 border border-border/50 flex flex-col items-center justify-center min-h-[220px]">
              {/* Badge de tendência (top-right) */}
              {metrics.trend && (
                <div className="self-end mb-2">
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                      metrics.trend.color === 'green' && 'bg-green-500/10 text-green-500',
                      metrics.trend.color === 'yellow' && 'bg-amber-500/10 text-amber-500',
                      metrics.trend.color === 'red' && 'bg-red-500/10 text-red-500'
                    )}
                  >
                    {metrics.trend.direction === 'improving' && <TrendingUp className="w-3 h-3" />}
                    {metrics.trend.direction === 'declining' && <TrendingDown className="w-3 h-3" />}
                    {metrics.trend.direction === 'stable' && <Minus className="w-3 h-3" />}
                    <span>{metrics.trend.label}</span>
                  </div>
                </div>
              )}

              {/* Progress Ring com Score */}
              <div className="relative flex items-center justify-center">
                <ProgressRing score={metrics.score} color={metrics.scoreColor} size={160} strokeWidth={10} />
                {/* Score value centered inside ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      'text-4xl sm:text-5xl font-bold',
                      metrics.scoreColor === 'green' && 'text-green-500',
                      metrics.scoreColor === 'yellow' && 'text-amber-500',
                      metrics.scoreColor === 'red' && 'text-red-500'
                    )}
                  >
                    {metrics.score}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium capitalize mt-1',
                      metrics.scoreColor === 'green' && 'text-green-500',
                      metrics.scoreColor === 'yellow' && 'text-amber-500',
                      metrics.scoreColor === 'red' && 'text-red-500'
                    )}
                  >
                    {metrics.scoreLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Cards Secundários - Empilhados Verticalmente */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
              {/* Burn Rate */}
              <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Burn Rate</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-foreground">
                      {formatCurrency(metrics.burnRate.current)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      6m: {formatCurrency(metrics.burnRate.sixMonths)}
                      {metrics.burnRate.hasLimitedData && (
                        <span className="text-amber-500 ml-1">*</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprometimento Fixo */}
              <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Comprometimento Fixo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold text-foreground">
                      {metrics.fixedCommitment.value.toFixed(1)}%
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
                        metrics.fixedCommitment.status === 'saudável' && 'bg-green-500/10 text-green-500',
                        metrics.fixedCommitment.status === 'atenção' && 'bg-amber-500/10 text-amber-500',
                        metrics.fixedCommitment.status === 'risco' && 'bg-red-500/10 text-red-500'
                      )}
                    >
                      {metrics.fixedCommitment.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tempo de Sobrevivência */}
              <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Tempo de Sobrevivência</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {metrics.survivalTime.isStable ? (
                      <span className="text-lg sm:text-xl font-bold text-green-500">Estável</span>
                    ) : (
                      <>
                        <span className="text-lg sm:text-xl font-bold text-foreground">
                          {metrics.survivalTime.value.toFixed(1)}{' '}
                          <span className="text-xs text-muted-foreground font-normal">
                            {metrics.survivalTime.unit}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
                            metrics.survivalTime.status === 'saudável' && 'bg-green-500/10 text-green-500',
                            metrics.survivalTime.status === 'atenção' && 'bg-amber-500/10 text-amber-500',
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

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Score skeleton */}
      <div className="lg:col-span-5 bg-muted/30 rounded-lg p-6 border border-border/50 flex items-center justify-center min-h-[220px]">
        <div className="w-40 h-40 rounded-full bg-muted animate-pulse" />
      </div>
      {/* Secondary cards skeleton */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-muted/30 rounded-lg px-4 py-3 border border-border/50 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-6 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
