import crypto from 'crypto';

export interface TokenPair {
  token: string;      // Token puro para enviar ao usuário
  tokenHash: string;  // Hash SHA-256 para armazenar no banco
}

/**
 * Gera token seguro de 32 bytes + hash SHA-256
 */
export function generateResetToken(): TokenPair {
  const token = crypto.randomBytes(32).toString('hex'); // 64 caracteres hex
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return { token, tokenHash };
}

/**
 * Cria hash de um token existente para comparação
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}
