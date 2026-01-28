import { PrismaClient, Prisma } from '@prisma/client';
import { startOfDay, isAfter } from 'date-fns';
import {
  RecurrenceInterval,
  RecurrenceDuration,
  generateRecurrenceDates,
  generateRecurrenceGroupId,
  isFutureDate,
  advanceDateByInterval,
  RECURRENCE_CONSTANTS,
} from '../utils/recurrence.utils';

interface CreateRecurrentRecordsParams {
  userId: string;
  valor: number;
  de?: string;
  para?: string;
  tipo: string;
  categoria: string;
  dataComprovante: Date;
  recurrenceInterval: RecurrenceInterval;
  recurrenceDuration: RecurrenceDuration;
}

interface CreateRecurrentRecordsResult {
  records: any[];
  recurrenceGroupId: string;
  totalCreated: number;
}

export class RecurrenceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Cria registro recorrente com todas as ocorrências
   * @param params Parâmetros do registro base
   * @returns Resultado com registros criados, groupId e total
   */
  async createRecurrentRecords(
    params: CreateRecurrentRecordsParams
  ): Promise<CreateRecurrentRecordsResult> {
    const {
      userId,
      valor,
      de,
      para,
      tipo,
      categoria,
      dataComprovante,
      recurrenceInterval,
      recurrenceDuration,
    } = params;

    // ⚠️ IMPORTANTE: isInfinite = true quando duration === 'indefinido'
    // Não depender apenas do texto da duração
    const isInfinite = recurrenceDuration === 'indefinido';

    // Gerar ID único para o grupo de recorrência
    const recurrenceGroupId = generateRecurrenceGroupId();

    // Gerar todas as datas de recorrência
    const dates = generateRecurrenceDates(
      dataComprovante,
      recurrenceInterval,
      recurrenceDuration
    );

    // Criar registros para cada data
    const recordsData = dates.map((date) => ({
      userId,
      valor: new Prisma.Decimal(valor),
      de: de || null,
      para: para || null,
      tipo,
      categoria,
      classificacao: 'recorrente',
      dataComprovante: date,
      isFuture: isFutureDate(date),
      recurrenceGroupId,
      recurrenceInterval,
      isInfinite,
    }));

    // Inserir todos os registros no banco
    await this.prisma.financeRecord.createMany({
      data: recordsData,
    });

    // Buscar os registros criados para retornar
    const createdRecords = await this.prisma.financeRecord.findMany({
      where: { recurrenceGroupId },
      orderBy: { dataComprovante: 'asc' },
    });

    return {
      records: createdRecords,
      recurrenceGroupId,
      totalCreated: createdRecords.length,
    };
  }

  /**
   * Garante buffer de registros futuros (lazy execution COM GUARDAS)
   * ⚠️ NÃO rodar buffer em toda chamada - usar guardas
   * @param userId ID do usuário
   */
  async ensureRecurrenceBuffer(userId: string): Promise<void> {
    // Guarda 1: Verificar se há recorrências infinitas
    const hasInfinite = await this.prisma.financeRecord.count({
      where: { userId, isInfinite: true },
      take: 1,
    });

    if (!hasInfinite) {
      return; // Skip se não há infinitas
    }

    // Guarda 2: Verificar quais grupos precisam de buffer
    const today = startOfDay(new Date());

    // Buscar todos os grupos infinitos com seus registros futuros
    const infiniteGroups = await this.prisma.financeRecord.groupBy({
      by: ['recurrenceGroupId'],
      where: {
        userId,
        isInfinite: true,
        recurrenceGroupId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Para cada grupo, verificar se precisa de buffer
    for (const group of infiniteGroups) {
      if (!group.recurrenceGroupId) continue;

      // Contar quantos registros futuros existem
      const futureCount = await this.prisma.financeRecord.count({
        where: {
          recurrenceGroupId: group.recurrenceGroupId,
          dataComprovante: { gt: today },
        },
      });

      // Se violou o buffer mínimo, gerar mais
      if (futureCount < RECURRENCE_CONSTANTS.MIN_FUTURE_ITEMS) {
        await this.generateMoreRecurrences(group.recurrenceGroupId);
      }
    }
  }

  /**
   * Gera mais registros para recorrência infinita
   * @param recurrenceGroupId ID do grupo de recorrência
   */
  private async generateMoreRecurrences(recurrenceGroupId: string): Promise<void> {
    // Buscar o último registro do grupo
    const lastRecord = await this.prisma.financeRecord.findFirst({
      where: { recurrenceGroupId },
      orderBy: { dataComprovante: 'desc' },
    });

    if (!lastRecord || !lastRecord.recurrenceInterval) {
      return;
    }

    // Gerar BATCH_SIZE novos registros
    const newRecordsData = [];
    let currentDate = lastRecord.dataComprovante;

    for (let i = 0; i < RECURRENCE_CONSTANTS.BATCH_SIZE; i++) {
      currentDate = advanceDateByInterval(currentDate, lastRecord.recurrenceInterval);

      newRecordsData.push({
        userId: lastRecord.userId,
        valor: lastRecord.valor,
        de: lastRecord.de,
        para: lastRecord.para,
        tipo: lastRecord.tipo,
        categoria: lastRecord.categoria,
        classificacao: lastRecord.classificacao,
        dataComprovante: currentDate,
        isFuture: isFutureDate(currentDate),
        recurrenceGroupId,
        recurrenceInterval: lastRecord.recurrenceInterval,
        isInfinite: true,
      });
    }

    // Inserir novos registros
    await this.prisma.financeRecord.createMany({
      data: newRecordsData,
    });
  }

  /**
   * ⚠️ Sincroniza isFuture com dataComprovante > hoje
   * Chamar em pontos centrais ANTES de queries críticas
   * @param userId ID do usuário
   * @returns Número de registros atualizados
   */
  async syncIsFutureFlags(userId: string): Promise<number> {
    const today = startOfDay(new Date());

    // Atualizar registros que deveriam ser futuros mas não estão marcados
    const { count: futureUpdated } = await this.prisma.financeRecord.updateMany({
      where: {
        userId,
        dataComprovante: { gt: today },
        isFuture: false,
      },
      data: {
        isFuture: true,
      },
    });

    // Atualizar registros que não deveriam ser futuros mas estão marcados
    const { count: pastUpdated } = await this.prisma.financeRecord.updateMany({
      where: {
        userId,
        dataComprovante: { lte: today },
        isFuture: true,
      },
      data: {
        isFuture: false,
      },
    });

    return futureUpdated + pastUpdated;
  }
}
