# Documentação - Metas e Objetivos Financeiros

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Banco de Dados](#banco-de-dados)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Sistema de Gamificação](#sistema-de-gamificação)
7. [Fluxo de Dados](#fluxo-de-dados)

---

## Visão Geral

Sistema completo de gestão de metas financeiras com gamificação integrada ao Octopus IA. Permite aos usuários criar, acompanhar e gerenciar objetivos financeiros com sistema de níveis, XP e conquistas (badges).

### Funcionalidades Principais
- **Gestão de Metas**: CRUD completo de metas financeiras
- **4 Tipos de Metas**: Economia, Limite de Gasto, Meta de Receita, Investimento
- **Cálculo Automático de Progresso**: Baseado em registros financeiros (FinanceRecord)
- **Gamificação**: Sistema de níveis (1-8), XP, badges e streaks
- **Alertas Inteligentes**: Metas em risco e notificações contextuais
- **Gráficos**: Visualização de progresso, conclusões e categorias
- **Limites por Assinatura**: 2 metas ativas (free/basic), 10 metas (pro)

---

## Arquitetura

### Stack Tecnológico
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validação**: Zod
- **State Management**: React Query (TanStack Query)
- **Charts**: Recharts

---

## Banco de Dados

### SQL - Criação de Tabelas

Execute os seguintes comandos SQL **na ordem apresentada** para criar todas as tabelas necessárias:

#### 1. Adicionar Campos de Gamificação na Tabela Users

```sql
-- Adicionar campos de gamificação na tabela users (se não existirem)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_goals_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
```

#### 2. Adicionar Campo Context na Tabela AI Alerts

```sql
-- Adicionar campo context para diferenciar alertas de dashboard vs metas
ALTER TABLE ai_alerts
ADD COLUMN IF NOT EXISTS context VARCHAR(50) DEFAULT 'dashboard';
```

#### 3. Criar Tabela de Badges

```sql
-- Tabela de badges (conquistas)
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_code ON badges(code);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
```

#### 4. Criar Tabela de Metas Financeiras

```sql
-- Tabela de metas financeiras
CREATE TABLE IF NOT EXISTS financial_goals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    target_value DECIMAL(12, 2) NOT NULL,
    current_value DECIMAL(12, 2) DEFAULT 0,
    category VARCHAR(100),
    period VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    auto_complete BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_end_date ON financial_goals(end_date);
```

#### 5. Criar Tabela de Relação User-Badges

```sql
-- Tabela de relação user-badges
CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
```

#### 6. Inserir Badges Padrão

```sql
-- Inserir badges padrão (13 conquistas)
INSERT INTO badges (code, name, description, icon, category) VALUES
-- Metas (4 badges)
('first_goal', 'Primeira Meta', 'Completou sua primeira meta', 'trophy', 'metas'),
('goal_5', 'Focado', 'Completou 5 metas', 'target', 'metas'),
('goal_10', 'Determinado', 'Completou 10 metas', 'flame', 'metas'),
('goal_25', 'Imparável', 'Completou 25 metas', 'rocket', 'metas'),

-- Consistência (3 badges)
('streak_7', 'Consistente', 'Manteve uma sequência de 7 dias', 'calendar', 'consistencia'),
('streak_30', 'Disciplinado', 'Manteve uma sequência de 30 dias', 'calendar-check', 'consistencia'),
('streak_90', 'Mestre da Consistência', 'Manteve uma sequência de 90 dias', 'crown', 'consistencia'),

-- Economia (3 badges)
('saver_1k', 'Poupador', 'Economizou R$ 1.000', 'piggy-bank', 'economia'),
('saver_5k', 'Investidor', 'Economizou R$ 5.000', 'trending-up', 'economia'),
('saver_10k', 'Milionário em Formação', 'Economizou R$ 10.000', 'gem', 'economia'),

-- Especial (3 badges)
('early_bird', 'Madrugador', 'Completou uma meta antes do prazo', 'sunrise', 'especial'),
('perfectionist', 'Perfeccionista', 'Completou 5 metas antes do prazo', 'star', 'especial'),
('category_master', 'Mestre das Categorias', 'Completou metas em 5 categorias diferentes', 'grid', 'especial')

ON CONFLICT (code) DO NOTHING;
```

### Schema Prisma

```prisma
// Adicionar aos models existentes em server/prisma/schema.prisma

model User {
  // ... campos existentes

  // Gamification fields
  level               Int       @default(1)
  experience          Int       @default(0)
  totalGoalsCompleted Int       @default(0) @map("total_goals_completed")
  currentStreak       Int       @default(0) @map("current_streak")
  longestStreak       Int       @default(0) @map("longest_streak")

  financialGoals FinancialGoal[]
  badges         UserBadge[]
}

model AiAlert {
  // ... campos existentes
  context    String   @default("dashboard") // 'dashboard' | 'goals' | 'both'
}

model FinancialGoal {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  title           String
  description     String?
  type            String    // 'economia' | 'limite_gasto' | 'meta_receita' | 'investimento'
  targetValue     Decimal   @map("target_value") @db.Decimal(12, 2)
  currentValue    Decimal   @default(0) @map("current_value") @db.Decimal(12, 2)
  category        String?   // Liga com FinanceRecord.categoria
  period          String?   // 'mensal' | 'trimestral' | 'anual' | 'personalizado'
  startDate       DateTime  @map("start_date") @db.Date
  endDate         DateTime  @map("end_date") @db.Date
  status          String    @default("ativo") // 'ativo' | 'pausado' | 'concluido' | 'falhou'
  autoComplete    Boolean   @default(true) @map("auto_complete")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  completedAt     DateTime? @map("completed_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([endDate])
  @@map("financial_goals")
}

model Badge {
  id          String      @id @default(uuid())
  code        String      @unique
  name        String
  description String
  icon        String
  category    String      // 'metas' | 'consistencia' | 'economia' | 'especial'
  createdAt   DateTime    @default(now()) @map("created_at")

  users       UserBadge[]

  @@map("badges")
}

model UserBadge {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  badgeId    String   @map("badge_id")
  unlockedAt DateTime @default(now()) @map("unlocked_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId])
  @@map("user_badges")
}
```

---

## Backend

### Estrutura de Arquivos

```
server/src/
├── controllers/
│   └── goals.controller.ts    # Lógica de negócio de metas
├── routes/
│   └── goals.routes.ts         # Rotas REST de metas
├── index.ts                    # Registrar rotas de goals
└── prisma/
    └── schema.prisma           # Schema atualizado
```

### Rotas da API

**Base URL**: `/api/goals`

Todas as rotas requerem autenticação JWT.

#### Endpoints de Metas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar metas (com filtros) |
| GET | `/stats` | Estatísticas de metas |
| GET | `/alerts` | Alertas de metas |
| GET | `/:id` | Detalhes de uma meta |
| POST | `/` | Criar nova meta |
| PUT | `/:id` | Atualizar meta |
| DELETE | `/:id` | Excluir meta |
| POST | `/:id/sync` | Sincronizar progresso |

#### Endpoint de Gamificação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/user/gamification` | Dados de gamificação do usuário |

### Principais Funcionalidades do Controller

#### 1. Cálculo de Progresso (`calculateGoalProgress`)

```typescript
// Calcula progresso baseado no tipo de meta e registros financeiros
switch (goal.type) {
  case 'economia':
    return entradas - saidas;
  case 'limite_gasto':
    return saidas;
  case 'meta_receita':
    return entradas;
  case 'investimento':
    return records.filter(r =>
      r.tipo === 'saida' &&
      ['Reserva', 'Objetivos', 'Investimentos'].includes(r.categoria)
    ).reduce((sum, r) => sum + Number(r.valor), 0);
}
```

#### 2. Sistema de XP

**Recompensas de XP:**
- Meta completada: **50 XP**
- Conclusão antecipada (7+ dias): **+25 XP**
- Streak semanal: **20 XP**
- Streak mensal: **100 XP**
- Primeira meta em categoria: **30 XP**

**Níveis:**
```typescript
const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Iniciante', minXP: 0 },
  { level: 2, name: 'Aprendiz', minXP: 100 },
  { level: 3, name: 'Organizado', minXP: 300 },
  { level: 4, name: 'Disciplinado', minXP: 600 },
  { level: 5, name: 'Estrategista', minXP: 1000 },
  { level: 6, name: 'Expert', minXP: 1500 },
  { level: 7, name: 'Mestre', minXP: 2100 },
  { level: 8, name: 'Lenda', minXP: 2800 },
];
```

#### 3. Limites de Assinatura

```typescript
const GOAL_LIMITS = {
  none: 2,   // Plano gratuito
  basic: 2,  // Plano básico
  pro: 10,   // Plano PRO
};
```

#### 4. Detecção de Metas em Risco

```typescript
function isGoalAtRisk(goal: any): boolean {
  const timeProgress = elapsed / totalDuration;
  const valueProgress = currentValue / targetValue;

  // Meta em risco se passou 75% do tempo mas atingiu menos de 50% do valor
  return timeProgress > 0.75 && valueProgress < 0.5;
}
```

---

## Frontend

### Estrutura de Componentes

```
src/
├── pages/
│   └── Goals.tsx                          # Página principal de metas
├── components/
│   ├── goals/
│   │   ├── GoalCard.tsx                   # Card individual de meta
│   │   ├── GoalStatsCards.tsx             # 4 KPI cards
│   │   ├── GoalFilters.tsx                # Filtros (status, período)
│   │   ├── CreateGoalDialog.tsx           # Dialog de criação
│   │   ├── GoalProgressBar.tsx            # Barra de progresso
│   │   └── charts/
│   │       ├── GoalCompletionChart.tsx    # Gráfico de conclusões
│   │       └── GoalCategoryChart.tsx      # Gráfico por categoria
│   └── gamification/
│       ├── LevelBadge.tsx                 # Badge de nível
│       ├── ExperienceBar.tsx              # Barra de XP
│       ├── BadgeGrid.tsx                  # Grid de conquistas
│       └── MotivationalMessage.tsx        # Mensagens motivacionais
├── hooks/
│   └── useGoalsData.ts                    # Hook principal de dados
├── lib/
│   └── api.ts                             # Atualizado com goalsAPI
└── types/
    └── goals.ts                           # TypeScript types
```

### Página Principal - Goals.tsx

**Seções da Página:**

1. **Header**: Navegação global com logout
2. **Botão Voltar**: Retorna ao Dashboard
3. **Título e Botão Nova Meta**: Cabeçalho da página
4. **Seção de Gamificação**: Nível, XP, badges, streak
5. **KPI Cards**: Estatísticas (ativas, concluídas, em risco, taxa de sucesso)
6. **Mensagem Motivacional**: Dinâmica baseada em progresso
7. **Alertas IA**: Alertas contextuais de metas
8. **Filtros**: Por status e período
9. **Grid de Metas**: Cards de metas com ações
10. **Gráficos**: Conclusões ao longo do tempo + Progresso por categoria
11. **FAB Mobile**: Botão flutuante para criar meta

### Hook Principal - useGoalsData

```typescript
const {
  goals,                  // Lista de metas
  activeGoals,            // Metas ativas
  completedGoals,         // Metas concluídas
  atRiskGoals,            // Metas em risco
  stats,                  // Estatísticas gerais
  gamification,           // Dados de gamificação
  alerts,                 // Alertas de metas
  categoryChartData,      // Dados para gráfico de categorias
  completionChartData,    // Dados para gráfico de conclusões
  isLoading,              // Estado de carregamento
  error,                  // Erros
  mutations: {
    createGoal,           // Criar meta
    updateGoal,           // Atualizar meta
    deleteGoal,           // Excluir meta
    syncProgress,         // Sincronizar progresso
    isCreating,           // Estado de criação
    isUpdating,           // Estado de atualização
    isDeleting,           // Estado de exclusão
    isSyncing,            // Estado de sincronização
  }
} = useGoalsData({ status, period });
```

### Componente CreateGoalDialog

**Formulário de Criação:**

1. **Título**: Obrigatório, máx 100 caracteres
2. **Descrição**: Opcional, máx 500 caracteres
3. **Tipo de Meta**:
   - Economia
   - Limite de Gasto
   - Meta de Receita
   - Investimento
4. **Valor Alvo**: Obrigatório, numérico
5. **Categoria**: Opcional, lista dinâmica baseada no tipo
6. **Período**: Mensal, Trimestral, Anual, Personalizado
7. **Data Início/Término**: Ajustadas automaticamente por período
8. **Conclusão Automática**: Toggle (default: true)

**Validações:**
- Título não pode estar vazio
- Valor alvo deve ser positivo
- Data de término deve ser após data de início
- Respeita limites de assinatura

---

## Sistema de Gamificação

### Componentes de Gamificação

#### 1. LevelBadge
Exibe nível atual e nome do nível com ícone visual.

#### 2. ExperienceBar
Barra de progresso de XP com informações:
- XP atual / XP para próximo nível
- Porcentagem de progresso
- Preenchimento visual animado

#### 3. BadgeGrid
Grid responsivo de badges:
- Badges desbloqueadas (coloridas)
- Badges bloqueadas (opaco, opcional)
- Tooltip com descrição
- Data de desbloqueio

#### 4. MotivationalMessage
Mensagens dinâmicas baseadas em:
- Progresso geral
- Streaks
- Nível atual
- Metas em risco
- Conquistas recentes

**Exemplos:**
- "Você está quase lá! Faltam apenas X metas para o próximo nível!"
- "Parabéns! Você manteve um streak de X dias!"
- "Atenção: X metas precisam de atenção."

---

## Fluxo de Dados

### 1. Criação de Meta

```mermaid
Usuario -> Frontend: Preenche formulário
Frontend -> Backend: POST /api/goals
Backend -> DB: Verifica limite de assinatura
Backend -> DB: Cria FinancialGoal
Backend -> Frontend: Retorna meta criada
Frontend -> UI: Atualiza lista de metas
Frontend -> UI: Exibe toast de sucesso
```

### 2. Sincronização de Progresso

```mermaid
Usuario -> Frontend: Clica em "Sincronizar"
Frontend -> Backend: POST /api/goals/:id/sync
Backend -> DB: Busca FinanceRecords no período
Backend: Calcula progresso por tipo de meta
Backend -> DB: Atualiza currentValue
Backend: Verifica se atingiu meta (autoComplete)
Backend -> DB: Atualiza status se concluída
Backend -> DB: Adiciona XP ao usuário
Backend -> DB: Verifica e concede badges
Backend -> Frontend: Retorna meta atualizada
Frontend -> UI: Atualiza card da meta
Frontend -> UI: Exibe XP ganho (se concluída)
```

### 3. Cálculo de Gamificação

```mermaid
Backend -> DB: Busca user.experience
Backend: Calcula nível atual por thresholds
Backend: Calcula XP para próximo nível
Backend: Calcula progresso percentual
Backend -> DB: Busca badges do usuário
Backend: Monta array de badges com data
Backend -> Frontend: Retorna dados completos
Frontend -> UI: Renderiza LevelBadge
Frontend -> UI: Renderiza ExperienceBar
Frontend -> UI: Renderiza BadgeGrid
```

---

## Configurações Importantes

### Cache e Refetch

```typescript
// Configurações do React Query
{
  staleTime: 1000 * 30,        // 30s para metas/stats
  staleTime: 1000 * 60 * 5,    // 5min para gamificação
  refetchInterval: 1000 * 60,  // Refetch automático a cada 1min
  refetchOnWindowFocus: true,  // Refetch ao focar janela
}
```

### Cache-Busting

Todas as requests GET incluem parâmetro `_t: Date.now()` para evitar cache do navegador.

Backend envia headers:
```javascript
{
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
}
```

---

## Deploy e Manutenção

### Checklist de Deploy

1. ✅ Executar SQLs de criação de tabelas
2. ✅ Adicionar coluna `context` em `ai_alerts`
3. ✅ Regenerar Prisma Client: `npm run prisma:generate`
4. ✅ Build backend: `npm run build`
5. ✅ Build frontend com `VITE_API_URL` correto
6. ✅ Verificar variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `VITE_API_URL`

### Troubleshooting

#### Erro: "Cannot GET /api/goals/stats"
**Causa**: Código antigo em produção sem rotas de goals.
**Solução**: Fazer deploy do backend atualizado.

#### Erro: "The column 'ai_alerts.context' does not exist"
**Causa**: Migração do banco não executada.
**Solução**: Executar SQL `ALTER TABLE ai_alerts ADD COLUMN context...`

#### Erro: "Select.Item must have a value prop that is not an empty string"
**Causa**: SelectItem com `value=""` no CreateGoalDialog.
**Solução**: Já corrigido - usar `value={category || undefined}`.

---

## Melhorias Futuras

- [ ] Edição inline de metas
- [ ] Histórico de alterações de meta
- [ ] Notificações push quando meta estiver em risco
- [ ] Compartilhamento de metas
- [ ] Templates de metas (metas predefinidas)
- [ ] Importação/exportação de metas
- [ ] Relatórios PDF de progresso
- [ ] Conquistas personalizadas pelo usuário
- [ ] Ranking/leaderboard entre usuários (opcional)
- [ ] Meta recorrente (automática todo mês)

---

## Suporte e Contato

Para dúvidas ou problemas, consulte:
- `CLAUDE.md` - Instruções gerais do projeto
- Logs do backend no EasyPanel
- Console do navegador para erros frontend

---

**Última atualização**: 21/01/2025
**Versão**: 1.0.0
