import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validação
const updateReportSchema = z.object({
  report: z.enum(['none', 'simple', 'advanced'], {
    errorMap: () => ({ message: 'Tipo de relatório inválido' })
  })
});

// Buscar configurações do usuário logado
export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscription: true,
        report: true,
        lastReport: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
};

// Atualizar preferência de relatório
export const updateReportPreference = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { report } = updateReportSchema.parse(req.body);

    // Buscar usuário para verificar subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Validar: advanced só para subscription pro
    if (report === 'advanced' && user.subscription !== 'pro') {
      return res.status(403).json({
        error: 'Relatório avançado disponível apenas para assinatura Pro'
      });
    }

    // Atualizar preferência
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { report },
      select: {
        subscription: true,
        report: true,
        lastReport: true
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update report preference error:', error);
    res.status(500).json({ error: 'Erro ao atualizar preferência de relatório' });
  }
};
