# Migration: Sistema de Relatórios

Esta migration adiciona a tabela `reports` e a relação com `users`.

## SQL Esperado

Quando você executar `npx prisma migrate dev --name add_reports_table --create-only`, o Prisma deve gerar este SQL:

```sql
-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "counts_for_limit" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "filter_start_date" TEXT,
    "filter_end_date" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_user_id_requested_at_idx" ON "reports"("user_id", "requested_at" DESC);

-- CreateIndex
CREATE INDEX "reports_user_id_counts_for_limit_requested_at_idx" ON "reports"("user_id", "counts_for_limit", "requested_at");

-- CreateIndex
CREATE INDEX "reports_user_id_status_idx" ON "reports"("user_id", "status");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Validações Antes de Aplicar

Verifique se o SQL gerado:

### ✅ Estrutura da Tabela
- [x] Campo `id` é TEXT e PRIMARY KEY
- [x] Campo `user_id` é TEXT NOT NULL
- [x] Campo `status` é TEXT NOT NULL (valores: 'pending', 'generating', 'sent', 'failed', 'insufficient_data')
- [x] Campo `type` é TEXT NOT NULL (valores: 'simple', 'advanced')
- [x] Campo `content` é TEXT NULL (pode ser vazio)
- [x] Campo `requested_at` tem DEFAULT CURRENT_TIMESTAMP
- [x] Campo `counts_for_limit` tem DEFAULT true
- [x] Campos `generated_at` e `sent_at` são NULL por padrão

### ✅ Índices
- [x] Índice composto `(user_id, requested_at DESC)` - para histórico ordenado
- [x] Índice composto `(user_id, counts_for_limit, requested_at)` - para cálculo de limite mensal
- [x] Índice composto `(user_id, status)` - para filtrar por status

### ✅ Foreign Key
- [x] FK `reports_user_id_fkey` aponta para `users(id)`
- [x] ON DELETE CASCADE - quando usuário é deletado, seus relatórios também são
- [x] ON UPDATE CASCADE - se ID do usuário mudar (improvável), propaga

## Rollback

Se precisar reverter a migration:

```sql
-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_user_id_fkey";

-- DropIndex
DROP INDEX "reports_user_id_status_idx";
DROP INDEX "reports_user_id_counts_for_limit_requested_at_idx";
DROP INDEX "reports_user_id_requested_at_idx";

-- DropTable
DROP TABLE "reports";
```

## Aplicar a Migration

### Desenvolvimento
```bash
# Gera e aplica automaticamente
npx prisma migrate dev --name add_reports_table
```

### Produção (Recomendado)
```bash
# 1. Gerar SQL sem aplicar
npx prisma migrate dev --name add_reports_table --create-only

# 2. Revisar SQL gerado em:
# server/prisma/migrations/XXXXXX_add_reports_table/migration.sql

# 3. Aplicar usando Prisma
npx prisma migrate deploy

# OU aplicar manualmente no banco
psql $DATABASE_URL < prisma/migrations/XXXXXX_add_reports_table/migration.sql
```

## Verificação Pós-Migration

Após aplicar, execute estas queries para validar:

```sql
-- 1. Verificar se tabela foi criada
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'reports';
-- Deve retornar: reports

-- 2. Verificar colunas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;
-- Deve listar todos os 12 campos

-- 3. Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'reports';
-- Deve listar: reports_pkey + 3 índices compostos

-- 4. Verificar foreign key
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'reports'
  AND tc.constraint_type = 'FOREIGN KEY';
-- Deve retornar: reports_user_id_fkey -> users(id)

-- 5. Testar inserção de exemplo
INSERT INTO reports (
    id,
    user_id,
    status,
    type,
    counts_for_limit
) VALUES (
    'test-report-id',
    (SELECT id FROM users LIMIT 1), -- Usa primeiro usuário existente
    'pending',
    'simple',
    true
) RETURNING *;
-- Deve inserir e retornar o registro

-- 6. Limpar teste
DELETE FROM reports WHERE id = 'test-report-id';
```

## Impacto no Sistema

### Sem Impacto (Tabela Nova)
- ✅ Não altera tabelas existentes
- ✅ Não afeta dados existentes
- ✅ Não quebra funcionalidades atuais
- ✅ Apenas adiciona nova funcionalidade

### Performance
- ⚡ 3 índices compostos otimizados
- ⚡ Queries de histórico/limite serão rápidas
- ⚡ FK com CASCADE não impacta delete de usuários (raro)

### Espaço em Disco
- 📦 Estimativa: ~1KB por relatório
- 📦 100 relatórios = ~100KB
- 📦 10,000 relatórios = ~10MB (negligível)

## Troubleshooting

### Erro: "relation already exists"
**Causa**: Tabela já foi criada anteriormente
**Solução**:
```sql
DROP TABLE IF EXISTS reports CASCADE;
-- Depois rode a migration novamente
```

### Erro: "foreign key constraint fails"
**Causa**: Referência a tabela `users` não encontrada
**Solução**: Verifique se a tabela `users` existe:
```sql
SELECT * FROM users LIMIT 1;
```

### Erro: "permission denied"
**Causa**: Usuário do banco não tem permissão para criar tabelas
**Solução**: Use usuário com permissões adequadas ou:
```sql
GRANT CREATE ON SCHEMA public TO seu_usuario;
```
