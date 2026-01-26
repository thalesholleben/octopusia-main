import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para autenticação de rotas internas (n8n)
 * Valida o header X-Internal-Key contra a variável de ambiente INTERNAL_API_KEY
 */
export const authenticateInternalKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const internalKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_API_KEY;

  // Verificar se a chave está configurada no servidor
  if (!expectedKey) {
    return res.status(500).json({
      error: 'INTERNAL_API_KEY not configured on server',
    });
  }

  // Verificar se o header foi enviado e se corresponde à chave esperada
  if (!internalKey || internalKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized - Invalid or missing X-Internal-Key header',
    });
  }

  // Autenticação bem-sucedida, continuar para o próximo middleware
  next();
};
