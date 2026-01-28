import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';

// Schemas de validação
const updateReportSchema = z.object({
  report: z.enum(['none', 'simple', 'advanced'], {
    errorMap: () => ({ message: 'Tipo de relatório inválido' })
  })
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

const updateNotificationPreferencesSchema = z.object({
  notifyEmail: z.boolean(),
  notifyChat: z.boolean(),
  notifyDashboard: z.boolean(),
});

const updateTemperamentSchema = z.object({
  temperament: z.enum(['neutro', 'direto', 'motivador', 'sarcastico', 'temperamental'], {
    errorMap: () => ({ message: 'Temperamento inválido' })
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
        lastReport: true,
        notifyEmail: true,
        notifyChat: true,
        notifyDashboard: true,
        temperament: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('[getSettings] error:', error);
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

// Alterar senha
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Verificar se nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'Nova senha deve ser diferente da atual' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};

// Buscar informações do chat vinculado
export const getChatInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        chatId: true,
        chatUsername: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      chatId: user.chatId,
      chatUsername: user.chatUsername,
      isLinked: !!user.chatId
    });
  } catch (error) {
    console.error('[getChatInfo] error:', error);
    res.status(500).json({ error: 'Erro ao buscar informações do chat' });
  }
};

// Desvincular chat
export const unlinkChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        chatId: null,
        chatUsername: null
      }
    });

    res.json({ message: 'Chat desvinculado com sucesso' });
  } catch (error) {
    console.error('Erro ao desvincular chat:', error);
    res.status(500).json({ error: 'Erro ao desvincular chat' });
  }
};

// Atualizar preferências de notificação
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { notifyEmail, notifyChat, notifyDashboard } = updateNotificationPreferencesSchema.parse(req.body);

    // Buscar usuário para verificar subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Validar: notifyChat só para subscription pro
    if (notifyChat && user.subscription !== 'pro') {
      return res.status(403).json({
        error: 'Notificações por chat disponíveis apenas para assinatura Pro'
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        notifyEmail,
        notifyChat,
        notifyDashboard,
      },
      select: {
        notifyEmail: true,
        notifyChat: true,
        notifyDashboard: true,
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar preferências de notificação:', error);
    res.status(500).json({ error: 'Erro ao atualizar preferências de notificação' });
  }
};

// Atualizar temperamento da IA
export const updateTemperament = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { temperament } = updateTemperamentSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { temperament },
      select: { temperament: true }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar temperamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar temperamento' });
  }
};
