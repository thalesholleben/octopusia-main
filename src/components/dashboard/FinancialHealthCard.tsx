import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdvancedHealthMetrics } from '@/hooks/useAdvancedHealthMetrics';
import type { PillarResult } from '@/lib/api';

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

// Pillar Bar Component
function PillarBar({ pillar }: { pillar: PillarResult }) {
  const colorClass =
    pillar.score >= 70
      ? 'bg-green-500'
      : pillar.score >= 50
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-muted-foreground w-24 truncate">{pillar.name}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClass)}
          style={{ width: `${pillar.score}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{pillar.score}</span>
    </div>
  );
}

export function FinancialHealthCard() {
  const { metrics, isLoading, hasData } = useAdvancedHealthMetrics();

  return (
    <div className="mb-6 sm:mb-8">
      <div
        className="card-float p-4 sm:p-6 opacity-0 animate-fade-up"
        style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Saúde Financeira
          </h2>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : hasData && metrics ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Score Card - Destaque Principal */}
              <div className="lg:col-span-6 bg-muted/30 rounded-lg p-4 sm:p-6 border border-border/50 flex flex-col items-center justify-center min-h-[220px]">
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
                  <ProgressRing
                    score={metrics.score}
                    color={metrics.scoreColor}
                    size={160}
                    strokeWidth={10}
                  />
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

              {/* Pilares - 6 barras de progresso verticais */}
              <div className="lg:col-span-6 bg-muted/30 rounded-lg p-4 border border-border/50 flex flex-col justify-center gap-2">
                <PillarBar pillar={metrics.pillars.cashFlowStability} />
                <PillarBar pillar={metrics.pillars.predictability} />
                <PillarBar pillar={metrics.pillars.operationalMargin} />
                <PillarBar pillar={metrics.pillars.futurePressure} />
                <PillarBar pillar={metrics.pillars.flowQuality} />
                <PillarBar pillar={metrics.pillars.resilience} />
              </div>
            </div>

            {/* Footer - Disclaimer */}
            <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
              Score baseado nos próximos 30 dias. Registros inconsistentes invalidam o Score.
            </p>
          </>
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
      <div className="lg:col-span-6 bg-muted/30 rounded-lg p-6 border border-border/50 flex items-center justify-center min-h-[220px]">
        <div className="w-40 h-40 rounded-full bg-muted animate-pulse" />
      </div>
      {/* Pillars skeleton */}
      <div className="lg:col-span-6 bg-muted/30 rounded-lg p-4 border border-border/50 flex flex-col justify-center gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            <div className="flex-1 h-2 bg-muted rounded-full animate-pulse" />
            <div className="h-3 bg-muted rounded w-8 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
