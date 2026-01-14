import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import '../types/express';

const prisma = new PrismaClient();

// Schema de validação para filtros
const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tipo: z.enum(['entrada', 'saida']).optional(),
  categoria: z.string().optional(),
});

export const getFinanceRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
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

    res.json({ records });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Get finance records error:', error);
    res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
  }
};

export const getAIAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const alerts = await prisma.aIAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Últimos 10 alertas
    });

    res.json({ alerts });
  } catch (error) {
    console.error('Get AI alerts error:', error);
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
