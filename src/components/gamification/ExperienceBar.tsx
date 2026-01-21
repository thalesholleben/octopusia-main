import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExperienceBarProps {
  currentXP: number;
  xpProgress: number;
  xpForNextLevel: number;
  className?: string;
}

export function ExperienceBar({
  currentXP,
  xpProgress,
  xpForNextLevel,
  className,
}: ExperienceBarProps) {
  const isMaxLevel = xpForNextLevel === 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[10px] sm:text-xs">
        <div className="flex items-center gap-1 text-primary font-medium">
          <Sparkles className="w-3 h-3" />
          <span>{currentXP} XP</span>
        </div>
        {!isMaxLevel && (
          <span className="text-muted-foreground">
            {xpForNextLevel} XP para próximo nível
          </span>
        )}
        {isMaxLevel && (
          <span className="text-primary font-medium">Nível máximo!</span>
        )}
      </div>
      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isMaxLevel
              ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-pulse'
              : 'bg-gradient-to-r from-primary to-primary/70'
          )}
          style={{ width: `${Math.min(xpProgress, 100)}%` }}
        />
      </div>
    </div>
  );
}
