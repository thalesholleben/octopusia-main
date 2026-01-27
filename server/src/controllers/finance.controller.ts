import { Request, Response } from 'express';
import { z } from 'zod';
import { subMonths, parseISO, startOfDay } from 'date-fns';
import prisma from '../config/database';
import { FinanceService } from '../services/finance.service';

// Instanciar o FinanceService
const financeService = new FinanceService(prisma);

// Schema de validação para filtros
const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tipo: z.enum(['entrada', 'saida']).optional(),
  categoria: z.string().optional(),
});

// Schema de validação para paginação
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

// Schema de validação para criação de registro financeiro
const createRecordSchema = z.object({
  valor: z.number().positive('Valor deve ser positivo'),
  de: z.string().optional(),
  para: z.string().optional(),
  tipo: z.enum(['entrada', 'saida'], {
    errorMap: () => ({ message: 'Tipo deve ser "entrada" ou "saida"' })
  }),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  classificacao: z.enum(['fixo', 'variavel', 'recorrente']).optional(),
  dataComprovante: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida'
  }),
});

// Schema de validação para atualização de registro
const updateRecordSchema = z.object({
  valor: z.number().positive('Valor deve ser positivo').optional(),
  de: z.string().optional().nullable(),
  para: z.string().optional().nullable(),
  tipo: z.enum(['entrada', 'saida']).optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória').optional(),
  classificacao: z.enum(['fixo', 'variavel', 'recorrente']).optional().nullable(),
  dataComprovante: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida'
  }).optional(),
});

// Schema para categoria customizada
const customCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  tipo: z.enum(['entrada', 'saida'], {
    errorMap: () => ({ message: 'Tipo deve ser "entrada" ou "saida"' })
  }),
});

// Schema de validação para ajuste de saldo
const balanceAdjustmentSchema = z.object({
  targetBalance: z.number({ required_error: 'Saldo desejado é obrigatório' }),
});

// Categorias padrão
const DEFAULT_EXPENSE_CATEGORIES = [
  'Aluguel', 'Contas Fixas', 'Alimentação', 'FastFood', 'Transporte',
  'Saúde', 'Filhos', 'Trabalho', 'Ferramentas', 'Lazer e Vida Social',
  'Dívidas', 'Reserva', 'Objetivos', 'Educação', 'Imprevistos', 'Outros'
];
const DEFAULT_INCOME_CATEGORIES = ['Serviço', 'Produto', 'Outros'];

export const getFinanceRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validar filtros e paginação
    const { startDate, endDate, tipo, categoria } = filterSchema.parse(req.query);
    const { page, limit } = paginationSchema.parse(req.query);

    const where: any = { userId };

    // HARD LIMIT: Sempre limitar aos últimos 12 meses
    const twelveMonthsAgo = subMonths(new Date(), 12);
    where.dataComprovante = {};

    // Aplicar hard limit de 12 meses
    if (startDate) {
      // Parse in local timezone
      const [year, month, day] = startDate.split('-').map(Number);
      const userStartDate = new Date(year, month - 1, day, 0, 0, 0);
      // Usar a data mais restritiva (mais recente)
      where.dataComprovante.gte = userStartDate > twelveMonthsAgo ? userStartDate : twelveMonthsAgo;
    } else {
      where.dataComprovante.gte = twelveMonthsAgo;
    }

    // Filtro de data final (se fornecido)
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      where.dataComprovante.lte = new Date(year, month - 1, day, 23, 59, 59);
    }

    // Filtro de tipo
    if (tipo) where.tipo = tipo;

    // Filtro de categoria
    if (categoria) where.categoria = categoria;

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Executar query de registros e count em paralelo
    const [records, totalRecords] = await Promise.all([
      prisma.financeRecord.findMany({
        where,
        orderBy: { dataComprovante: 'desc' },
        skip,
        take: limit,
      }),
      prisma.financeRecord.count({ where }),
    ]);

    // Calcular metadata de paginação
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      records,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        pageSize: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[getFinanceRecords] error:', error);
    res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
  }
};

export const getAIAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const alerts = await prisma.aiAlert.findMany({
      where: {
        userId,
        status: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10, // Últimos 10 alertas
    });

    res.json({ alerts });
  } catch (error) {
    console.error('[getAIAlerts] error:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
};

/**
 * GET /api/finance/summary
 * Retorna resumo financeiro completo (KPIs + registros + alertas)
 * Autenticação: JWT (Bearer token)
 */
export const getFinanceSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const filters = filterSchema.parse(req.query);

    // Buscar dados em paralelo
    const [kpis, records, alerts] = await Promise.all([
      financeService.getKPIs(userId, filters),
      financeService.getRecords(userId, filters),
      financeService.getAlerts(userId),
    ]);

    // Controller decide o formato da resposta
    res.json({ kpis, records, alerts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[getFinanceSummary] error:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo financeiro' });
  }
};

/**
 * GET /api/finance/expense-distribution
 * Retorna distribuição de gastos por categoria (EXCLUI ajuste_saldo)
 * Autenticação: JWT (Bearer token)
 */
export const getExpenseDistribution = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const filters = filterSchema.parse(req.query);

    const distribution = await financeService.getExpenseDistribution(userId, filters);

    res.json({ distribution });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[getExpenseDistribution] error:', error);
    res.status(500).json({ error: 'Erro ao buscar distribuição de gastos' });
  }
};

/**
 * GET /api/internal/finance/summary
 * Retorna apenas KPIs financeiros para uso interno (n8n)
 * Autenticação: X-Internal-Key header
 */
export const getInternalFinanceSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // Validar userId obrigatório
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Validar e aplicar filtros
    const filters = filterSchema.parse(req.query);

    // Retornar apenas KPIs (sem records e alerts)
    const kpis = await financeService.getKPIs(userId, filters);

    res.json({ kpis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[getInternalFinanceSummary] error:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs' });
  }
};

// Endpoint para estatísticas (KPIs)
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const filters = filterSchema.parse(req.query);

    // Usar o FinanceService para calcular KPIs
    const kpis = await financeService.getKPIs(userId, filters);

    // Manter compatibilidade com resposta antiga (campo totalEntradas/totalSaidas)
    res.json({
      totalEntradas: kpis.entradas,
      totalSaidas: kpis.saidas,
      // Incluir todos os KPIs (saldo, totalTransacoes, etc.)
      ...kpis,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas' });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Buscar clientes únicos (de + para)
    const records = await prisma.financeRecord.findMany({
      where: { userId },
      select: { de: true, para: true },
    });

    const clientsSet = new Set<string>();
    records.forEach(r => {
      if (r.de) clientsSet.add(r.de);
      if (r.para) clientsSet.add(r.para);
    });

    const clients = Array.from(clientsSet).sort();

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

export const createFinanceRecord = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createRecordSchema.parse(req.body);

    // Parse date as UTC (YYYY-MM-DD -> início do dia em UTC)
    // Input: "2026-01-22" -> Output: Date object at UTC midnight
    const utcDate = startOfDay(parseISO(data.dataComprovante + 'T00:00:00Z'));

    const record = await prisma.financeRecord.create({
      data: {
        userId,
        valor: data.valor,
        de: data.de,
        para: data.para,
        tipo: data.tipo,
        categoria: data.categoria,
        classificacao: data.classificacao,
        dataComprovante: utcDate,
      },
    });

    res.status(201).json({
      message: 'Registro financeiro criado com sucesso',
      record,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create finance record error:', error);
    res.status(500).json({ error: 'Erro ao criar registro financeiro' });
  }
};

// Atualizar registro financeiro
export const updateFinanceRecord = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateRecordSchema.parse(req.body);

    // Verificar se o registro pertence ao usuário
    const existing = await prisma.financeRecord.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    // Parse date in UTC if provided
    let utcDate;
    if (data.dataComprovante !== undefined) {
      utcDate = startOfDay(parseISO(data.dataComprovante + 'T00:00:00Z'));
    }

    const record = await prisma.financeRecord.update({
      where: { id },
      data: {
        ...(data.valor !== undefined && { valor: data.valor }),
        ...(data.de !== undefined && { de: data.de }),
        ...(data.para !== undefined && { para: data.para }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.categoria !== undefined && { categoria: data.categoria }),
        ...(data.classificacao !== undefined && { classificacao: data.classificacao }),
        ...(utcDate !== undefined && { dataComprovante: utcDate }),
      },
    });

    res.json({ message: 'Registro atualizado com sucesso', record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update finance record error:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro' });
  }
};

// Excluir registro financeiro
export const deleteFinanceRecord = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verificar se o registro pertence ao usuário
    const existing = await prisma.financeRecord.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    await prisma.financeRecord.delete({ where: { id } });

    res.json({ message: 'Registro excluído com sucesso' });
  } catch (error) {
    console.error('Delete finance record error:', error);
    res.status(500).json({ error: 'Erro ao excluir registro' });
  }
};

export const createBalanceAdjustment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { targetBalance } = balanceAdjustmentSchema.parse(req.body);

    const financeService = new FinanceService(prisma);
    const result = await financeService.adjustBalance(userId, targetBalance);

    res.status(201).json(result);
  } catch (error: any) {
    // Handle service-thrown errors with status
    if (error.status) {
      return res.status(error.status).json({
        error: error.error,
        message: error.message,
        limit: error.limit,
        current: error.current,
      });
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error('Balance adjustment error:', error);
    res.status(500).json({ error: 'Erro ao ajustar saldo' });
  }
};

// Buscar todas as categorias (padrão + customizadas)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Buscar categorias customizadas do usuário
    const customCategories = await prisma.userCustomCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    res.json({
      defaultCategories: {
        entrada: DEFAULT_INCOME_CATEGORIES,
        saida: DEFAULT_EXPENSE_CATEGORIES,
      },
      customCategories: customCategories.map(c => ({
        id: c.id,
        name: c.name,
        tipo: c.tipo,
        isCustom: true,
      })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

// Criar categoria customizada (PRO only)
export const createCustomCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Verificar se é PRO
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.subscription !== 'pro') {
      return res.status(403).json({
        error: 'Categorias personalizadas são exclusivas do plano PRO'
      });
    }

    // Verificar limite de 10 categorias
    const count = await prisma.userCustomCategory.count({ where: { userId } });
    if (count >= 10) {
      return res.status(400).json({
        error: 'Limite de 10 categorias personalizadas atingido'
      });
    }

    const data = customCategorySchema.parse(req.body);

    const category = await prisma.userCustomCategory.create({
      data: {
        userId,
        name: data.name,
        tipo: data.tipo,
      },
    });

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category: { id: category.id, name: category.name, tipo: category.tipo, isCustom: true }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Categoria com este nome já existe' });
    }
    console.error('Create custom category error:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
};

// Atualizar categoria customizada (PRO only)
export const updateCustomCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verificar se é PRO
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.subscription !== 'pro') {
      return res.status(403).json({
        error: 'Categorias personalizadas são exclusivas do plano PRO'
      });
    }

    // Verificar se a categoria pertence ao usuário
    const existing = await prisma.userCustomCategory.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const data = customCategorySchema.parse(req.body);

    const category = await prisma.userCustomCategory.update({
      where: { id },
      data: { name: data.name, tipo: data.tipo },
    });

    res.json({
      message: 'Categoria atualizada com sucesso',
      category: { id: category.id, name: category.name, tipo: category.tipo, isCustom: true }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Categoria com este nome já existe' });
    }
    console.error('Update custom category error:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
};

// Excluir categoria customizada (PRO only)
export const deleteCustomCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verificar se é PRO
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.subscription !== 'pro') {
      return res.status(403).json({
        error: 'Categorias personalizadas são exclusivas do plano PRO'
      });
    }

    // Verificar se a categoria pertence ao usuário
    const existing = await prisma.userCustomCategory.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await prisma.userCustomCategory.delete({ where: { id } });

    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Delete custom category error:', error);
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
};

// Página de alertas - últimos 30 alertas ordenados por prioridade
export const getAlertsPage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Últimos 30 alertas ativos (não concluídos ou ignorados)
    const alerts = await prisma.aiAlert.findMany({
      where: {
        userId,
        status: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Ordenar por prioridade (alta > media > baixa), depois por data
    const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
    const sortedAlerts = alerts.sort((a, b) => {
      const priorityDiff = priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Contagem por prioridade (dos 30 alertas)
    const priorityCounts = {
      alta: alerts.filter(a => a.prioridade === 'alta').length,
      media: alerts.filter(a => a.prioridade === 'media').length,
      baixa: alerts.filter(a => a.prioridade === 'baixa').length,
    };

    res.json({
      alerts: sortedAlerts,
      stats: {
        totalAlerts: alerts.length,
        priorityCounts,
      },
    });
  } catch (error) {
    console.error('[getAlertsPage] error:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
};

// Schema de validação para status de alerta
const updateAlertStatusSchema = z.object({
  status: z.enum(['concluido', 'ignorado'], {
    errorMap: () => ({ message: 'Status inválido. Use "concluido" ou "ignorado".' })
  }),
});

export const updateAlertStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = updateAlertStatusSchema.parse(req.body);

    // Verificar se alerta existe e pertence ao usuário
    const existingAlert = await prisma.aiAlert.findFirst({
      where: { id, userId },
    });

    if (!existingAlert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    // Prevenir remarcar alertas já concluídos ou ignorados
    if (existingAlert.status !== null) {
      return res.status(400).json({
        error: 'Alerta já foi marcado como concluído ou ignorado'
      });
    }

    // Atualizar status do alerta
    const updatedAlert = await prisma.aiAlert.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: `Alerta marcado como ${status}`,
      alert: updatedAlert,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[updateAlertStatus] error:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do alerta' });
  }
};

/**
 * GET /api/finance/health-metrics
 * Retorna métricas de saúde financeira
 */
export const getHealthMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const metrics = await financeService.getHealthMetrics(userId);
    res.json(metrics);
  } catch (error) {
    console.error('[getHealthMetrics] error:', error);
    res.status(500).json({ error: 'Erro ao calcular métricas de saúde' });
  }
};

/**
 * GET /api/finance/seasonality?tipo=entrada|saida
 * Retorna sazonalidade (max/min/avg mensal últimos 12 meses)
 */
const seasonalitySchema = z.object({
  tipo: z.enum(['entrada', 'saida'], {
    errorMap: () => ({ message: 'Tipo deve ser "entrada" ou "saida"' }),
  }),
});

export const getSeasonality = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tipo } = seasonalitySchema.parse(req.query);
    const seasonality = await financeService.getSeasonality(userId, tipo);
    res.json(seasonality);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[getSeasonality] error:', error);
    res.status(500).json({ error: 'Erro ao calcular sazonalidade' });
  }
};
