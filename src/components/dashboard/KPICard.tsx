import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon: ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  delay?: number;
  noIconBg?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  delay = 0,
  noIconBg = false
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />;
    return <Minus className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  const getTrendClass = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'trend-up';
    if (trend.value < 0) return 'trend-down';
    return 'trend-neutral';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return 'border-success/20 bg-gradient-to-br from-success/5 to-transparent';
      case 'negative':
        return 'border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent';
      case 'warning':
        return 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent';
      default:
        return 'border-border';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'positive':
        return 'bg-success/10 text-success';
      case 'negative':
        return 'bg-destructive/10 text-destructive';
      case 'warning':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div 
      className={cn(
        'card-float p-3 sm:p-4 opacity-0 animate-fade-up',
        getVariantStyles()
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className={cn(
            'text-base sm:text-xl lg:text-2xl font-bold tracking-tight truncate',
            variant === 'positive' && 'text-success',
            variant === 'negative' && 'text-destructive'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={cn('flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium', getTrendClass())}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value).toFixed(2)}%</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{trend.label}</p>
            </div>
          )}
        </div>
        <div className={cn('p-1.5 sm:p-2 rounded-lg shrink-0', !noIconBg && getIconBg())}>
          {icon}
        </div>
      </div>
    </div>
  );
}
