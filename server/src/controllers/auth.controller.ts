import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { z } from 'zod';
import axios from 'axios';
import { generateToken } from '../utils/jwt.utils';

const prisma = new PrismaClient();

// Schemas de validação
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
      },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });

    // Gerar token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const login = (req: Request, res: Response) => {
  try {
    loginSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
  }

  passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: info?.message || 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  })(req, res);
};

export const me = async (req: Request, res: Response) => {
  try {
    // req.user já foi definido pelo middleware authenticateJWT
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};

// Schema de validação para recuperação de senha
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Always return the same message for security
    const genericMessage = 'Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.';

    const webhookUrl = process.env.PASSWORD_RECOVERY_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('PASSWORD_RECOVERY_WEBHOOK_URL not configured');
      // Still return generic message to not reveal configuration status
      return res.json({ message: genericMessage });
    }

    // Check if user exists (but don't reveal this to the client)
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Send to n8n webhook
      try {
        await axios.post(webhookUrl, {
          email: user.email,
          displayName: user.displayName || '',
          userId: user.id,
          timestamp: new Date().toISOString(),
        }, {
          timeout: 5000, // 5 second timeout
        });
      } catch (webhookError) {
        console.error('Error calling password recovery webhook:', webhookError);
        // Don't reveal webhook errors to client
      }
    }

    // Always return success to prevent email enumeration
    res.json({ message: genericMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};
