import {
  Trophy, Target, Flame, Zap, Star, Award, Crown, Shield,
  PiggyBank, TrendingUp, Calendar, Sparkles, Medal, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt?: string;
}

interface BadgeGridProps {
  badges: Badge[];
  showLocked?: boolean;
}

const BADGE_ICONS: Record<string, typeof Trophy> = {
  trophy: Trophy,
  target: Target,
  flame: Flame,
  zap: Zap,
  star: Star,
  award: Award,
  crown: Crown,
  shield: Shield,
  piggy: PiggyBank,
  trending: TrendingUp,
  calendar: Calendar,
  sparkles: Sparkles,
  medal: Medal,
  gift: Gift,
};

const CATEGORY_COLORS: Record<string, string> = {
  metas: 'from-primary to-primary/70',
  consistencia: 'from-orange-400 to-orange-600',
  economia: 'from-green-400 to-green-600',
  especial: 'from-purple-400 to-purple-600',
};

// All available badges for showing locked state
const ALL_BADGES: Badge[] = [
  { id: '1', code: 'first_goal', name: 'Primeiro Passo', description: 'Complete sua primeira meta', icon: 'target', category: 'metas' },
  { id: '2', code: 'goal_5', name: 'Determinado', description: 'Complete 5 metas', icon: 'zap', category: 'metas' },
  { id: '3', code: 'goal_10', name: 'Persistente', description: 'Complete 10 metas', icon: 'flame', category: 'metas' },
  { id: '4', code: 'goal_25', name: 'Imparável', description: 'Complete 25 metas', icon: 'trophy', category: 'metas' },
  { id: '5', code: 'streak_7', name: 'Semana Perfeita', description: '7 dias com metas em dia', icon: 'calendar', category: 'consistencia' },
  { id: '6', code: 'streak_30', name: 'Mês Consistente', description: '30 dias consecutivos', icon: 'star', category: 'consistencia' },
  { id: '7', code: 'streak_90', name: 'Trimestre de Ouro', description: '90 dias consecutivos', icon: 'crown', category: 'consistencia' },
  { id: '8', code: 'save_1k', name: 'Poupador', description: 'Economize R$ 1.000', icon: 'piggy', category: 'economia' },
  { id: '9', code: 'save_10k', name: 'Investidor', description: 'Economize R$ 10.000', icon: 'trending', category: 'economia' },
  { id: '10', code: 'save_100k', name: 'Patrimônio', description: 'Economize R$ 100.000', icon: 'shield', category: 'economia' },
  { id: '11', code: 'early_bird', name: 'Antecipado', description: 'Complete meta com 7+ dias de antecedência', icon: 'sparkles', category: 'especial' },
  { id: '12', code: 'all_categories', name: 'Diversificado', description: 'Metas em 5 categorias diferentes', icon: 'medal', category: 'especial' },
  { id: '13', code: 'comeback', name: 'Volta por Cima', description: 'Complete uma meta após falhar uma anterior', icon: 'gift', category: 'especial' },
];

export function BadgeGrid({ badges, showLocked = true }: BadgeGridProps) {
  const unlockedCodes = new Set(badges.map(b => b.code));

  const displayBadges = showLocked
    ? ALL_BADGES.map(ab => {
        const unlocked = badges.find(b => b.code === ab.code);
        return unlocked || { ...ab, unlockedAt: undefined };
      })
    : badges;

  const safeParseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  if (displayBadges.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhuma conquista ainda</p>
        <p className="text-xs">Complete metas para ganhar badges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {displayBadges.map((badge) => {
        const isUnlocked = !!badge.unlockedAt || unlockedCodes.has(badge.code);
        const Icon = BADGE_ICONS[badge.icon] || Trophy;
        const colorClass = CATEGORY_COLORS[badge.category] || 'from-gray-400 to-gray-500';
        const unlockedDate = safeParseDate(badge.unlockedAt);

        return (
          <Tooltip key={badge.code}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'relative aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all',
                  isUnlocked
                    ? cn('bg-gradient-to-br', colorClass, 'shadow-md hover:scale-105')
                    : 'bg-secondary/50 border border-dashed border-border'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6',
                    isUnlocked ? 'text-white' : 'text-muted-foreground/30'
                  )}
                />
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-background/50 rounded-lg" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="font-semibold">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {isUnlocked && unlockedDate && (
                <p className="text-[10px] text-primary mt-1">
                  Desbloqueado em {format(unlockedDate, "dd/MM/yy", { locale: ptBR })}
                </p>
              )}
              {!isUnlocked && (
                <p className="text-[10px] text-muted-foreground mt-1">Bloqueado</p>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
