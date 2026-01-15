import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para proteger o endpoint de registro.
 * Requer uma chave de registro válida no header X-Registration-Key.
 */
export const requireRegistrationKey = (req: Request, res: Response, next: NextFunction) => {
  const registrationKey = req.headers['x-registration-key'];
  const validKey = process.env.REGISTRATION_KEY;

  if (!validKey) {
    console.warn('REGISTRATION_KEY não configurada no ambiente');
    return res.status(500).json({ error: 'Registro temporariamente indisponível' });
  }

  if (!registrationKey) {
    return res.status(403).json({ error: 'Chave de registro não fornecida' });
  }

  if (registrationKey !== validKey) {
    return res.status(403).json({ error: 'Chave de registro inválida' });
  }

  next();
};
