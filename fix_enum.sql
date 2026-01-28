-- Corrigir o ENUM RecurrenceInterval
-- 1. Remover a constraint existente (se houver dados, primeiro backupear)
ALTER TABLE "finance_records"
  ALTER COLUMN "recurrence_interval" TYPE VARCHAR(20);

-- 2. Dropar o enum antigo
DROP TYPE IF EXISTS "RecurrenceInterval";

-- 3. Criar o novo enum com valores corretos em português
CREATE TYPE "RecurrenceInterval" AS ENUM (
  'semanal',
  'mensal',
  'trimestral',
  'semestral',
  'anual'
);

-- 4. Restaurar a coluna com o tipo correto
ALTER TABLE "finance_records"
  ALTER COLUMN "recurrence_interval" TYPE "RecurrenceInterval"
  USING "recurrence_interval"::text::"RecurrenceInterval";
