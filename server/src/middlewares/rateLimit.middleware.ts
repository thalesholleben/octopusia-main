import rateLimit from 'express-rate-limit';

// Rate limiter para endpoints de autenticação
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true, // Retornar info no `RateLimit-*` headers
  legacyHeaders: false, // Desabilitar `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Contar requisições bem-sucedidas
});

// Rate limiter para endpoints gerais
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
