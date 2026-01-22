import { Request, Response } from 'express';
import { z } from 'zod';
import { subMonths } from 'date-fns';
import prisma from '../config/database';

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
    console.log('[getFinanceRecords] userId:', userId);  // DEBUG LOG
    console.log('[getFinanceRecords] query params:', req.query);  // DEBUG LOG

    // Validar filtros e paginação
    const { startDate, endDate, tipo, categoria } = filterSchema.parse(req.query);
    const { page, limit } = paginationSchema.parse(req.query);

    const where: any = { userId };

    // HARD LIMIT: Sempre limitar aos últimos 12 meses
    const twelveMonthsAgo = subMonths(new Date(), 12);
    where.dataComprovante = {};

    // Aplicar hard limit de 12 meses
    if (startDate) {
      const userStartDate = new Date(startDate);
      // Usar a data mais restritiva (mais recente)
      where.dataComprovante.gte = userStartDate > twelveMonthsAgo ? userStartDate : twelveMonthsAgo;
    } else {
      where.dataComprovante.gte = twelveMonthsAgo;
    }

    // Filtro de data final (se fornecido)
    if (endDate) {
      where.dataComprovante.lte = new Date(endDate);
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

    console.log('[getFinanceRecords] found records:', records.length, 'total:', totalRecords);  // DEBUG LOG

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
    console.log('[getAIAlerts] userId:', userId);  // DEBUG LOG

    const alerts = await prisma.aiAlert.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10, // Últimos 10 alertas
    });
    console.log('[getAIAlerts] found alerts:', alerts.length);  // DEBUG LOG

    res.json({ alerts });
  } catch (error) {
    console.error('[getAIAlerts] error:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
};

// Endpoint para estatísticas (KPIs)
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = filterSchema.parse(req.query);

    const where: any = { userId };

    if (startDate || endDate) {
      where.dataComprovante = {};
      if (startDate) where.dataComprovante.gte = new Date(startDate);
      if (endDate) where.dataComprovante.lte = new Date(endDate);
    }

    // Somas por tipo
    const entradas = await prisma.financeRecord.aggregate({
      where: { ...where, tipo: 'entrada' },
      _sum: { valor: true },
    });

    const saidas = await prisma.financeRecord.aggregate({
      where: { ...where, tipo: 'saida' },
      _sum: { valor: true },
    });

    const totalEntradas = Number(entradas._sum.valor || 0);
    const totalSaidas = Number(saidas._sum.valor || 0);
    const saldo = totalEntradas - totalSaidas;

    // Contar transações
    const totalTransacoes = await prisma.financeRecord.count({ where });

    res.json({
      totalEntradas,
      totalSaidas,
      saldo,
      totalTransacoes,
    });
  } catch (error) {
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

    const record = await prisma.financeRecord.create({
      data: {
        userId,
        valor: data.valor,
        de: data.de,
        para: data.para,
        tipo: data.tipo,
        categoria: data.categoria,
        classificacao: data.classificacao,
        dataComprovante: new Date(data.dataComprovante),
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

    const record = await prisma.financeRecord.update({
      where: { id },
      data: {
        ...(data.valor !== undefined && { valor: data.valor }),
        ...(data.de !== undefined && { de: data.de }),
        ...(data.para !== undefined && { para: data.para }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.categoria !== undefined && { categoria: data.categoria }),
        ...(data.classificacao !== undefined && { classificacao: data.classificacao }),
        ...(data.dataComprovante !== undefined && {
          dataComprovante: new Date(data.dataComprovante)
        }),
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
