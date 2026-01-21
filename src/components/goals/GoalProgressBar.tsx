import { cn } from '@/lib/utils';

interface GoalProgressBarProps {
  progress: number;
  type: 'economia' | 'limite_gasto' | 'meta_receita' | 'investimento';
  atRisk?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function GoalProgressBar({
  progress,
  type,
  atRisk = false,
  size = 'md',
  showLabel = true,
}: GoalProgressBarProps) {
  const getProgressColor = () => {
    if (atRisk) return 'bg-destructive';
    if (progress >= 100) return 'bg-success';
    if (progress >= 75) return 'bg-success/80';
    if (progress >= 50) return 'bg-primary';
    if (progress >= 25) return 'bg-warning';
    return 'bg-muted-foreground';
  };

  const getBackgroundColor = () => {
    if (atRisk) return 'bg-destructive/10';
    return 'bg-secondary';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  // For limite_gasto, invert the visual (lower is better)
  const displayProgress = type === 'limite_gasto'
    ? Math.max(0, 100 - progress)
    : progress;
  const isOverLimit = type === 'limite_gasto' && progress > 100;

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] sm:text-xs">
          <span className={cn(
            'font-medium',
            atRisk && 'text-destructive',
            isOverLimit && 'text-destructive',
            !atRisk && !isOverLimit && progress >= 100 && 'text-success',
          )}>
            {type === 'limite_gasto'
              ? (isOverLimit ? 'Limite excedido!' : `${Math.round(100 - progress)}% disponível`)
              : `${Math.round(Math.min(progress, 100))}% concluído`
            }
          </span>
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden', getBackgroundColor(), getSizeStyles())}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getProgressColor(),
            isOverLimit && 'animate-pulse'
          )}
          style={{ width: `${Math.min(type === 'limite_gasto' ? progress : displayProgress, 100)}%` }}
        />
      </div>
    </div>
  );
}
