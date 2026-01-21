import { Star, Crown, Trophy, Shield, Award, Zap, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  levelName: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const LEVEL_ICONS: Record<number, typeof Star> = {
  1: Star,
  2: Zap,
  3: Shield,
  4: Flame,
  5: Award,
  6: Trophy,
  7: Crown,
  8: Sparkles,
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-green-400 to-green-600',
  3: 'from-blue-400 to-blue-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-orange-400 to-orange-600',
  6: 'from-pink-400 to-pink-600',
  7: 'from-yellow-400 to-yellow-600',
  8: 'from-primary to-primary/80',
};

export function LevelBadge({ level, levelName, size = 'md', showName = true }: LevelBadgeProps) {
  const Icon = LEVEL_ICONS[level] || Star;
  const colorClass = LEVEL_COLORS[level] || LEVEL_COLORS[1];

  const sizeStyles = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
    md: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-sm' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-base' },
  };

  const styles = sizeStyles[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg',
          colorClass,
          styles.container
        )}
      >
        <Icon className={cn('text-white', styles.icon)} />
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-1.5 py-0.5 text-[10px] font-bold border border-border">
          {level}
        </div>
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className={cn('font-semibold text-foreground', styles.text)}>
            {levelName}
          </span>
          <span className="text-[10px] text-muted-foreground">Nível {level}</span>
        </div>
      )}
    </div>
  );
}
