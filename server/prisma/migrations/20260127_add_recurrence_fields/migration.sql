-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('semanal', 'mensal', 'trimestral', 'semestral', 'anual');

-- AlterTable
ALTER TABLE "finance_records" ADD COLUMN "is_future" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "finance_records" ADD COLUMN "recurrence_group_id" UUID;
ALTER TABLE "finance_records" ADD COLUMN "recurrence_interval" "RecurrenceInterval";
ALTER TABLE "finance_records" ADD COLUMN "is_infinite" BOOLEAN NOT NULL DEFAULT false;

-- ⚠️ MIGRAÇÃO IMPORTANTE: 'fixo' removido do sistema
-- Agora 'recorrente' cobre esse caso de uso
-- Documentação: classificacao='fixo' não é mais suportado na UI
UPDATE "finance_records" SET "classificacao" = 'variavel' WHERE "classificacao" = 'fixo';

-- CreateIndex
CREATE INDEX "finance_records_user_id_recurrence_group_id_idx" ON "finance_records"("user_id", "recurrence_group_id");

-- CreateIndex
CREATE INDEX "finance_records_user_id_is_future_idx" ON "finance_records"("user_id", "is_future");
