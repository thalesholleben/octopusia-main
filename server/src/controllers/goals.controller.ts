import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

// Constants
const GOAL_LIMITS: Record<string, number> = {
  none: 2,
  basic: 2,
  pro: 10,
};

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Iniciante', minXP: 0 },
  { level: 2, name: 'Aprendiz', minXP: 100 },
  { level: 3, name: 'Organizado', minXP: 300 },
  { level: 4, name: 'Disciplinado', minXP: 600 },
  { level: 5, name: 'Estrategista', minXP: 1000 },
  { level: 6, name: 'Expert', minXP: 1500 },
  { level: 7, name: 'Mestre', minXP: 2100 },
  { level: 8, name: 'Lenda', minXP: 2800 },
];

const XP_REWARDS = {
  goalCompleted: 50,
  earlyCompletion: 25,
  weeklyStreak: 20,
  monthlyStreak: 100,
  firstCategoryGoal: 30,
};

// Schemas
const createGoalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  type: z.enum(['economia', 'limite_gasto', 'meta_receita', 'investimento'], {
    errorMap: () => ({ message: 'Tipo de meta inválido' })
  }),
  targetValue: z.number().positive('Valor alvo deve ser positivo'),
  category: z.string().optional(),
  period: z.enum(['mensal', 'trimestral', 'anual', 'personalizado']).optional(),
  startDate: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Data de início inválida' }),
  endDate: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Data de término inválida' }),
  autoComplete: z.boolean().optional().default(true),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  targetValue: z.number().positive().optional(),
  category: z.string().optional().nullable(),
  period: z.enum(['mensal', 'trimestral', 'anual', 'personalizado']).optional().nullable(),
  startDate: z.string().refine(d => !isNaN(Date.parse(d))).optional(),
  endDate: z.string().refine(d => !isNaN(Date.parse(d))).optional(),
  status: z.enum(['ativo', 'pausado', 'concluido', 'falhou']).optional(),
  autoComplete: z.boolean().optional(),
});

const filterSchema = z.object({
  status: z.enum(['ativo', 'pausado', 'concluido', 'falhou']).optional(),
  period: z.enum(['mensal', 'trimestral', 'anual', 'personalizado']).optional(),
}).passthrough(); // Permite campos extras como _t (cache-busting)

// Helper para limpar query params vazios
function cleanQueryParams(query: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== '' && value !== undefined && value !== null && key !== '_t') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Helper functions
function getLevelFromXP(xp: number): { level: number; name: string; minXP: number; nextLevelXP: number | null } {
  let currentLevel = LEVEL_THRESHOLDS[0];

  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXP) {
      currentLevel = threshold;
    } else {
      break;
    }
  }

  const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === currentLevel.level + 1);

  return {
    ...currentLevel,
    nextLevelXP: nextLevel?.minXP || null,
  };
}

async function calculateGoalProgress(goal: any, userId: string): Promise<number> {
  const records = await prisma.financeRecord.findMany({
    where: {
      userId,
      dataComprovante: {
        gte: goal.startDate,
        lte: goal.endDate,
      },
      ...(goal.category && { categoria: goal.category }),
    },
  });

  const entradas = records
    .filter(r => r.tipo === 'entrada')
    .reduce((sum, r) => sum + Number(r.valor), 0);

  const saidas = records
    .filter(r => r.tipo === 'saida')
    .reduce((sum, r) => sum + Number(r.valor), 0);

  switch (goal.type) {
    case 'economia':
      return entradas - saidas;
    case 'limite_gasto':
      return saidas;
    case 'meta_receita':
      return entradas;
    case 'investimento':
      const reservas = records
        .filter(r => r.tipo === 'saida' && ['Reserva', 'Objetivos', 'Investimentos'].includes(r.categoria))
        .reduce((sum, r) => sum + Number(r.valor), 0);
      return reservas;
    default:
      return 0;
  }
}

function isGoalAtRisk(goal: any): boolean {
  const now = new Date();
  const start = new Date(goal.startDate);
  const end = new Date(goal.endDate);

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const timeProgress = elapsed / totalDuration;

  const valueProgress = Number(goal.currentValue) / Number(goal.targetValue);

  return timeProgress > 0.75 && valueProgress < 0.5;
}

function isGoalSuccessful(goal: any): boolean {
  const currentValue = Number(goal.currentValue);
  const targetValue = Number(goal.targetValue);

  switch (goal.type) {
    case 'economia':
    case 'meta_receita':
    case 'investimento':
      return currentValue >= targetValue;
    case 'limite_gasto':
      return currentValue <= targetValue;
    default:
      return false;
  }
}

async function awardXP(userId: string, amount: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { experience: true, level: true }
  });

  if (!user) return;

  const newXP = user.experience + amount;
  const newLevel = getLevelFromXP(newXP);

  await prisma.user.update({
    where: { id: userId },
    data: {
      experience: newXP,
      level: newLevel.level,
    }
  });
}

async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalGoalsCompleted: true,
      currentStreak: true,
      longestStreak: true,
      badges: { include: { badge: true } },
    }
  });

  if (!user) return [];

  const existingBadgeCodes = user.badges.map(ub => ub.badge.code);
  const newBadges: string[] = [];

  const badgesToCheck = [
    { code: 'first_goal', condition: user.totalGoalsCompleted >= 1 },
    { code: 'goal_5', condition: user.totalGoalsCompleted >= 5 },
    { code: 'goal_10', condition: user.totalGoalsCompleted >= 10 },
    { code: 'goal_25', condition: user.totalGoalsCompleted >= 25 },
    { code: 'streak_7', condition: user.currentStreak >= 7 },
    { code: 'streak_30', condition: user.currentStreak >= 30 },
    { code: 'streak_90', condition: user.currentStreak >= 90 },
  ];

  for (const { code, condition } of badgesToCheck) {
    if (condition && !existingBadgeCodes.includes(code)) {
      const badge = await prisma.badge.findUnique({ where: { code } });
      if (badge) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id }
        });
        newBadges.push(code);
      }
    }
  }

  return newBadges;
}

// Controllers
export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cleanedQuery = cleanQueryParams(req.query as Record<string, any>);
    const { status, period } = filterSchema.parse(cleanedQuery);

    const where: any = { userId };
    if (status) where.status = status;
    if (period) where.period = period;

    const goals = await prisma.financialGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      targetValue: Number(goal.targetValue),
      currentValue: Number(goal.currentValue),
      progress: Number(goal.targetValue) > 0
        ? Math.min(100, (Number(goal.currentValue) / Number(goal.targetValue)) * 100)
        : 0,
      atRisk: goal.status === 'ativo' && isGoalAtRisk(goal),
    }));

    res.json({ goals: goalsWithProgress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[getGoals] error:', error);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
};

export const getGoalStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [active, completed, failed, total] = await Promise.all([
      prisma.financialGoal.count({ where: { userId, status: 'ativo' } }),
      prisma.financialGoal.count({ where: { userId, status: 'concluido' } }),
      prisma.financialGoal.count({ where: { userId, status: 'falhou' } }),
      prisma.financialGoal.count({ where: { userId } }),
    ]);

    const activeGoals = await prisma.financialGoal.findMany({
      where: { userId, status: 'ativo' },
    });

    const atRisk = activeGoals.filter(goal => isGoalAtRisk(goal)).length;
    const successRate = total > 0 ? Math.round((completed / (completed + failed || 1)) * 100) : 0;

    res.json({
      active,
      completed,
      failed,
      atRisk,
      total,
      successRate,
    });
  } catch (error) {
    console.error('[getGoalStats] error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de metas' });
  }
};

export const getGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const calculatedProgress = await calculateGoalProgress(goal, userId);

    res.json({
      ...goal,
      targetValue: Number(goal.targetValue),
      currentValue: Number(goal.currentValue),
      calculatedProgress,
      progress: Number(goal.targetValue) > 0
        ? Math.min(100, (Number(goal.currentValue) / Number(goal.targetValue)) * 100)
        : 0,
      atRisk: goal.status === 'ativo' && isGoalAtRisk(goal),
    });
  } catch (error) {
    console.error('[getGoal] error:', error);
    res.status(500).json({ error: 'Erro ao buscar meta' });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createGoalSchema.parse(req.body);

    // Check subscription limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const activeGoals = await prisma.financialGoal.count({
      where: { userId, status: 'ativo' }
    });

    const limit = GOAL_LIMITS[user.subscription] || GOAL_LIMITS.none;

    if (activeGoals >= limit) {
      return res.status(403).json({
        error: `Limite de metas atingido (${limit}). Faça upgrade para PRO para criar mais metas.`,
        limit,
        current: activeGoals,
      });
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        type: data.type,
        targetValue: data.targetValue,
        category: data.category,
        period: data.period,
        startDate,
        endDate,
        autoComplete: data.autoComplete,
      },
    });

    res.status(201).json({
      message: 'Meta criada com sucesso',
      goal: {
        ...goal,
        targetValue: Number(goal.targetValue),
        currentValue: Number(goal.currentValue),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[createGoal] error:', error);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateGoalSchema.parse(req.body);

    const existingGoal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const updateData: any = { ...data };

    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    // If marking as completed manually
    if (data.status === 'concluido' && existingGoal.status !== 'concluido') {
      updateData.completedAt = new Date();

      // Award XP
      await awardXP(userId, XP_REWARDS.goalCompleted);

      // Check for early completion bonus
      const daysEarly = Math.floor((new Date(existingGoal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysEarly >= 7) {
        await awardXP(userId, XP_REWARDS.earlyCompletion);
      }

      // Update user stats
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalGoalsCompleted: { increment: 1 },
          currentStreak: { increment: 1 },
        }
      });

      // Check for badges
      await checkAndAwardBadges(userId);
    }

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Meta atualizada com sucesso',
      goal: {
        ...goal,
        targetValue: Number(goal.targetValue),
        currentValue: Number(goal.currentValue),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[updateGoal] error:', error);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingGoal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    await prisma.financialGoal.delete({
      where: { id },
    });

    res.json({ message: 'Meta excluída com sucesso' });
  } catch (error) {
    console.error('[deleteGoal] error:', error);
    res.status(500).json({ error: 'Erro ao excluir meta' });
  }
};

export const syncGoalProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const calculatedProgress = await calculateGoalProgress(goal, userId);

    const updatedGoal = await prisma.financialGoal.update({
      where: { id },
      data: { currentValue: calculatedProgress },
    });

    // Check for auto-completion
    if (goal.autoComplete && goal.status === 'ativo') {
      const isSuccessful = isGoalSuccessful({ ...updatedGoal, currentValue: calculatedProgress });

      if (isSuccessful) {
        await prisma.financialGoal.update({
          where: { id },
          data: {
            status: 'concluido',
            completedAt: new Date(),
          },
        });

        await awardXP(userId, XP_REWARDS.goalCompleted);

        const daysEarly = Math.floor((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysEarly >= 7) {
          await awardXP(userId, XP_REWARDS.earlyCompletion);
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            totalGoalsCompleted: { increment: 1 },
            currentStreak: { increment: 1 },
          }
        });

        await checkAndAwardBadges(userId);
      }
    }

    res.json({
      message: 'Progresso sincronizado com sucesso',
      goal: {
        ...updatedGoal,
        targetValue: Number(updatedGoal.targetValue),
        currentValue: calculatedProgress,
        progress: Number(updatedGoal.targetValue) > 0
          ? Math.min(100, (calculatedProgress / Number(updatedGoal.targetValue)) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('[syncGoalProgress] error:', error);
    res.status(500).json({ error: 'Erro ao sincronizar progresso' });
  }
};

export const getGamification = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        experience: true,
        totalGoalsCompleted: true,
        currentStreak: true,
        longestStreak: true,
        badges: {
          include: {
            badge: true,
          },
          orderBy: {
            unlockedAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const levelInfo = getLevelFromXP(user.experience);
    const xpForNextLevel = levelInfo.nextLevelXP
      ? levelInfo.nextLevelXP - user.experience
      : 0;
    const xpProgress = levelInfo.nextLevelXP
      ? ((user.experience - levelInfo.minXP) / (levelInfo.nextLevelXP - levelInfo.minXP)) * 100
      : 100;

    res.json({
      level: user.level,
      levelName: levelInfo.name,
      experience: user.experience,
      xpForNextLevel,
      xpProgress: Math.round(xpProgress),
      totalGoalsCompleted: user.totalGoalsCompleted,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      badges: user.badges.map(ub => ({
        ...ub.badge,
        unlockedAt: ub.unlockedAt,
      })),
    });
  } catch (error) {
    console.error('[getGamification] error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de gamificação' });
  }
};

export const getGoalAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const alerts = await prisma.aiAlert.findMany({
      where: {
        userId,
        context: { in: ['goals', 'both'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    res.json({ alerts });
  } catch (error) {
    console.error('[getGoalAlerts] error:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas de metas' });
  }
};
