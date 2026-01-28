import { z } from 'zod';

/**
 * Schema para geração de relatório
 * Filtros de data são opcionais
 */
export const generateReportSchema = z.object({
  filterStartDate: z.string().optional(),
  filterEndDate: z.string().optional(),
});

/**
 * Schema para callback do n8n
 * Atualiza status do relatório após geração
 */
export const reportCallbackSchema = z.object({
  reportId: z.string().uuid('reportId deve ser um UUID válido'),
  status: z.enum(['sent', 'failed'], {
    errorMap: () => ({ message: 'status deve ser "sent" ou "failed"' }),
  }),
  content: z.string().optional(),
  errorMessage: z.string().optional(),
});

/**
 * Schema para query params de histórico
 */
export const reportHistorySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});
