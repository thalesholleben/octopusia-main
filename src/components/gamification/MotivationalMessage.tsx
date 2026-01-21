import { useMemo } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, PartyPopper, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GamificationData, FinancialGoal } from '@/lib/api';

interface MotivationalMessageProps {
  gamification: GamificationData | null;
  goals: FinancialGoal[];
  atRiskGoals: FinancialGoal[];
}

interface Message {
  text: string;
  icon: typeof Lightbulb;
  variant: 'info' | 'success' | 'warning' | 'special';
}

export function MotivationalMessage({ gamification, goals, atRiskGoals }: MotivationalMessageProps) {
  const message = useMemo<Message>(() => {
    // Priority: at risk > streak achievements > progress encouragement > default

    // Check for at-risk goals
    if (atRiskGoals.length > 0) {
      const goal = atRiskGoals[0];
      return {
        text: `Atenção: sua meta "${goal.title}" está em risco. Revise seu progresso para não perder!`,
        icon: AlertTriangle,
        variant: 'warning',
      };
    }

    // Check for streak achievements
    if (gamification?.currentStreak && gamification.currentStreak >= 30) {
      return {
        text: `Incrível! ${gamification.currentStreak} dias de streak! Você está no caminho certo!`,
        icon: Flame,
        variant: 'special',
      };
    }

    if (gamification?.currentStreak && gamification.currentStreak >= 7) {
      return {
        text: `${gamification.currentStreak} dias de streak! Continue assim para manter o ritmo!`,
        icon: Flame,
        variant: 'success',
      };
    }

    // Check for recent completions
    const recentlyCompleted = goals.filter(g =>
      g.status === 'concluido' &&
      g.completedAt &&
      new Date(g.completedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentlyCompleted.length > 0) {
      return {
        text: `Parabéns! Você concluiu ${recentlyCompleted.length} meta(s) essa semana!`,
        icon: PartyPopper,
        variant: 'success',
      };
    }

    // Check for goals close to completion
    const almostDone = goals.find(g =>
      g.status === 'ativo' &&
      g.progress >= 80 &&
      g.progress < 100
    );

    if (almostDone) {
      const remaining = almostDone.targetValue - almostDone.currentValue;
      return {
        text: `Você está a ${Math.round(100 - almostDone.progress)}% de completar "${almostDone.title}". Faltam R$ ${remaining.toFixed(2).replace('.', ',')}!`,
        icon: TrendingUp,
        variant: 'info',
      };
    }

    // Default encouraging message
    const activeGoals = goals.filter(g => g.status === 'ativo');
    if (activeGoals.length === 0) {
      return {
        text: 'Crie sua primeira meta e comece a acompanhar seu progresso financeiro!',
        icon: Lightbulb,
        variant: 'info',
      };
    }

    return {
      text: `Você tem ${activeGoals.length} meta(s) ativa(s). Continue focado para alcançar seus objetivos!`,
      icon: TrendingUp,
      variant: 'info',
    };
  }, [gamification, goals, atRiskGoals]);

  const variantStyles = {
    info: 'bg-primary/5 border-primary/20 text-primary',
    success: 'bg-success/5 border-success/20 text-success',
    warning: 'bg-destructive/5 border-destructive/20 text-destructive',
    special: 'bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/30 text-primary',
  };

  const Icon = message.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 sm:p-4 rounded-lg border',
        variantStyles[message.variant]
      )}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <p className="text-xs sm:text-sm leading-relaxed text-foreground">
        {message.text}
      </p>
    </div>
  );
}
