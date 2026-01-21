export type GoalType = 'economia' | 'limite_gasto' | 'meta_receita' | 'investimento';
export type GoalStatus = 'ativo' | 'pausado' | 'concluido' | 'falhou';
export type GoalPeriod = 'mensal' | 'trimestral' | 'anual' | 'personalizado';

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  category?: string;
  period?: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  autoComplete: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  progress: number;
  atRisk: boolean;
}

export interface GoalStats {
  active: number;
  completed: number;
  failed: number;
  atRisk: number;
  total: number;
  successRate: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'metas' | 'consistencia' | 'economia' | 'especial';
  createdAt: string;
  unlockedAt?: string;
}

export interface GamificationData {
  level: number;
  levelName: string;
  experience: number;
  xpForNextLevel: number;
  xpProgress: number;
  totalGoalsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
}

export interface CreateGoalData {
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  category?: string;
  period?: GoalPeriod;
  startDate: string;
  endDate: string;
  autoComplete?: boolean;
}

export interface UpdateGoalData {
  title?: string;
  description?: string | null;
  targetValue?: number;
  category?: string | null;
  period?: GoalPeriod | null;
  startDate?: string;
  endDate?: string;
  status?: GoalStatus;
  autoComplete?: boolean;
}

export interface GoalFilters {
  status?: GoalStatus;
  period?: GoalPeriod;
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  economia: 'Economia',
  limite_gasto: 'Limite de Gasto',
  meta_receita: 'Meta de Receita',
  investimento: 'Investimento',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  concluido: 'Concluído',
  falhou: 'Não Atingido',
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
  personalizado: 'Personalizado',
};

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Organizado',
  4: 'Disciplinado',
  5: 'Estrategista',
  6: 'Expert',
  7: 'Mestre',
  8: 'Lenda',
};
