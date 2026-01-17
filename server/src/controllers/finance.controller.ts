import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

// Schema de validação para filtros
const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tipo: z.enum(['entrada', 'saida']).optional(),
  categoria: z.string().optional(),
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
  dataComprovante: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida'
  }),
});

export const getFinanceRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log('[getFinanceRecords] userId:', userId);  // DEBUG LOG
    console.log('[getFinanceRecords] query params:', req.query);  // DEBUG LOG

    const { startDate, endDate, tipo, categoria } = filterSchema.parse(req.query);

    const where: any = { userId };

    // Filtro de data
    if (startDate || endDate) {
      where.dataComprovante = {};
      if (startDate) where.dataComprovante.gte = new Date(startDate);
      if (endDate) where.dataComprovante.lte = new Date(endDate);
    }

    // Filtro de tipo
    if (tipo) where.tipo = tipo;

    // Filtro de categoria
    if (categoria) where.categoria = categoria;

    const records = await prisma.financeRecord.findMany({
      where,
      orderBy: { dataComprovante: 'desc' },
    });
    console.log('[getFinanceRecords] found records:', records.length);  // DEBUG LOG

    res.json({ records });
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
      orderBy: { createdAt: 'desc' },
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
