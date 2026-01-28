# Sistema de Relatórios com IA - Guia de Configuração

Este guia detalha como configurar o sistema de relatórios integrado com n8n.

## 1. Configuração do Backend

### 1.1 Aplicar Migration do Banco de Dados

```bash
cd server

# Opção 1: Desenvolvimento (aplica automaticamente)
npx prisma migrate dev --name add_reports_table

# Opção 2: Produção (revisar SQL antes de aplicar)
npx prisma migrate dev --name add_reports_table --create-only
# Revise o SQL gerado em: server/prisma/migrations/XXXXXX_add_reports_table/migration.sql
# Depois aplique:
npx prisma migrate deploy
```

### 1.2 Regenerar Prisma Client

```bash
cd server
npm run prisma:generate
```

### 1.3 Configurar Variáveis de Ambiente

Edite `server/.env` e adicione:

```env
# URL do webhook n8n
REPORTS_WEBHOOK_URL=https://seu-n8n.com/webhook/generate-report

# Chave de autenticação interna (use a mesma configurada no n8n)
INTERNAL_API_KEY=sua-chave-secreta-aqui
```

**Importante**: Gere uma chave segura para `INTERNAL_API_KEY`:
```bash
openssl rand -base64 32
```

## 2. Configuração do n8n

### 2.1 Criar Workflow no n8n

Crie um novo workflow com os seguintes nodes:

#### Node 1: Webhook Trigger
- **Tipo**: Webhook
- **Método**: POST
- **Path**: `/webhook/generate-report`
- **Response Mode**: Respond Immediately

**Payload recebido**:
```json
{
  "reportId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "displayName": "John Doe",
  "reportType": "simple" | "advanced",
  "timestamp": "2024-01-28T10:00:00.000Z",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "summary": {
    "kpis": {
      "saldo": 15000,
      "entradas": 50000,
      "saidas": 35000,
      "lucroLiquido": 15000,
      "margemLiquida": 30,
      "ticketMedio": 1250,
      "mediaMensal": 10000,
      "totalTransacoes": 42
    },
    "healthMetrics": {
      "score": 85,              // Score de saúde financeira (0-100)
      "burnRate": 8500,          // Gasto médio mensal (últimos 12 meses)
      "fixedCommitment": 45,     // % da renda comprometida com despesas fixas
      "survivalTime": 1.76       // Meses de sobrevivência com saldo atual
    }
  }
}
```

#### Node 2: Gerar Relatório com IA (OpenAI/Anthropic)
- **Tipo**: OpenAI/HTTP Request
- **Prompt**: Use os dados do `summary.kpis` para gerar relatório
- **Exemplo de Prompt**:

```
Você é um consultor financeiro. Analise os seguintes dados financeiros e gere um relatório {{reportType}}:

Período: {{filters.startDate}} a {{filters.endDate}}
Nome: {{displayName}}

Dados Financeiros:
- Saldo: R$ {{summary.kpis.saldo}}
- Entradas: R$ {{summary.kpis.entradas}}
- Saídas: R$ {{summary.kpis.saidas}}
- Lucro Líquido: R$ {{summary.kpis.lucroLiquido}}
- Margem Líquida: {{summary.kpis.margemLiquida}}%
- Ticket Médio: R$ {{summary.kpis.ticketMedio}}
- Média Mensal: R$ {{summary.kpis.mediaMensal}}
- Total de Transações: {{summary.kpis.totalTransacoes}}

Saúde Financeira:
- Score: {{summary.healthMetrics.score}}/100
- Burn Rate: R$ {{summary.healthMetrics.burnRate}}/mês
- Comprometimento com Fixos: {{summary.healthMetrics.fixedCommitment}}%
- Tempo de Sobrevivência: {{summary.healthMetrics.survivalTime}} meses

Instruções:
1. **Análise do Score de Saúde**: Interprete o score (0-40=crítico, 41-60=atenção, 61-80=saudável, 81-100=excelente)
2. **Burn Rate**: Destaque se está alto em relação à renda total
3. **Comprometimento Fixo**: Alerte se >70% (risco), >50% (atenção)
4. **Tempo de Sobrevivência**: Alerte se <3 meses (risco), <6 meses (atenção)

Gere um relatório em HTML com:
1. Resumo executivo com destaque para o score de saúde
2. Análise detalhada das métricas financeiras e de saúde
3. Insights personalizados e recomendações acionáveis
4. Alertas importantes baseados nas métricas de saúde

Formato: HTML completo com CSS inline para email.
```

#### Node 3: Enviar Email
- **Tipo**: Email
- **Para**: `{{userEmail}}`
- **Assunto**: `Relatório Financeiro - {{filters.startDate}} a {{filters.endDate}}`
- **Corpo**: Saída do Node 2 (HTML gerado pela IA)

#### Node 4: Callback - Sucesso
- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `https://seu-backend.com/api/internal/reports/callback`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "X-Internal-Key": "sua-chave-secreta-aqui"
  }
  ```
- **Body**:
  ```json
  {
    "reportId": "{{reportId}}",
    "status": "sent",
    "content": "{{conteúdo HTML do relatório}}"
  }
  ```

#### Node 5: Callback - Erro (On Error)
- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `https://seu-backend.com/api/internal/reports/callback`
- **Headers**: (mesmos do Node 4)
- **Body**:
  ```json
  {
    "reportId": "{{reportId}}",
    "status": "failed",
    "errorMessage": "{{error.message}}"
  }
  ```

### 2.2 Configurar Retry Policy

Configure retry automático no Node 4 (Callback):
- **Max Retries**: 3
- **Backoff Strategy**: Exponential
- **Wait Between Retries**: 10s, 30s, 60s

### 2.3 Ativar o Workflow

1. Salve o workflow
2. Ative-o (toggle no topo direito)
3. Copie a URL do webhook
4. Cole no `server/.env` como `REPORTS_WEBHOOK_URL`

## 3. Testes

### 3.1 Testar Geração de Relatório

1. **Login**: Acesse o sistema como usuário PRO
2. **Configurar**: Vá em Settings > Preferências de Relatório > Selecione "Simple" ou "Advanced"
3. **Gerar**: Clique em "Gerar Relatório" no card abaixo
4. **Verificar**:
   - Status deve mudar para "Gerando..."
   - Verifique execução no n8n
   - Email deve chegar em até 20 minutos

### 3.2 Testar Validações

**Cooldown (24h)**:
- Gere um relatório
- Tente gerar novamente imediatamente
- Deve mostrar mensagem de cooldown

**Limite Mensal (3 relatórios)**:
- Gere 3 relatórios (com intervalo de 24h)
- Tente gerar o 4º
- Deve mostrar mensagem de limite atingido

**Dados Insuficientes**:
- Login com usuário novo (sem registros)
- Tente gerar relatório
- Deve mostrar mensagem de dados insuficientes
- Cooldown deve ser aplicado mesmo assim

### 3.3 Logs para Debug

**Backend**:
```bash
cd server
npm run dev
# Observe logs de:
# - [generateReport] - quando usuário solicita
# - [reportCallback] - quando n8n retorna
```

**n8n**:
- Acesse o histórico de execuções
- Verifique payload recebido
- Verifique resposta da IA
- Verifique callback enviado

## 4. Monitoramento

### 4.1 Cron Job para Timeouts

Crie um cron job que execute a cada 30 minutos:

```bash
# server/src/cron/report-timeout.ts
import prisma from '../config/database';
import { ReportService } from '../services/report.service';

export async function checkReportTimeouts() {
  const reportService = new ReportService(prisma);
  const count = await reportService.markTimeoutReports();
  console.log(`[CRON] Marked ${count} timeout reports as failed`);
}
```

Configure no `server/src/index.ts`:
```typescript
import cron from 'node-cron';
import { checkReportTimeouts } from './cron/report-timeout';

// Executar a cada 30 minutos
cron.schedule('*/30 * * * *', checkReportTimeouts);
```

### 4.2 Métricas a Monitorar

- Taxa de sucesso de geração (sent vs failed)
- Tempo médio de geração
- Taxa de timeout
- Uso de limite mensal por usuário

## 5. Troubleshooting

### Problema: Webhook não dispara

**Verificar**:
1. `REPORTS_WEBHOOK_URL` está configurado corretamente?
2. n8n está online e workflow ativado?
3. Logs do backend mostram erro ao chamar webhook?

**Solução**:
```bash
# Testar webhook manualmente
curl -X POST https://seu-n8n.com/webhook/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "test-uuid",
    "userId": "test-user",
    "userEmail": "test@example.com",
    "displayName": "Test User",
    "reportType": "simple",
    "timestamp": "2024-01-28T10:00:00.000Z",
    "filters": {},
    "summary": { "kpis": {} }
  }'
```

### Problema: Callback falha (401/403)

**Verificar**:
1. `INTERNAL_API_KEY` no backend = Header `X-Internal-Key` no n8n?
2. Header está sendo enviado corretamente?

**Solução**:
- Compare as chaves nos dois lugares
- Verifique logs do backend: `[authenticateInternalKey]`

### Problema: Email não chega

**Verificar**:
1. Node de email está configurado no n8n?
2. Credenciais SMTP corretas?
3. Email do usuário está correto no banco?

**Solução**:
- Teste envio de email manual no n8n
- Verifique logs de execução do workflow

### Problema: Relatório marcado como timeout

**Verificar**:
1. n8n está demorando mais de 30 minutos?
2. Callback está sendo enviado?

**Solução**:
- Otimize geração do relatório (use modelos mais rápidos)
- Aumente timeout no cron job se necessário

## 6. Melhorias Futuras

- [ ] Permitir download de relatórios antigos
- [ ] Preview do relatório antes de enviar
- [ ] Configurar horário preferido de recebimento
- [ ] Comparação entre relatórios (mês atual vs anterior)
- [ ] Relatórios agendados automáticos (além de sob demanda)
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard de métricas de relatórios
- [ ] Template customizável de relatórios

## 7. Segurança

### 7.1 Checklist de Segurança

- [ ] `INTERNAL_API_KEY` é forte e único (>32 caracteres)
- [ ] Webhook n8n usa HTTPS
- [ ] Backend valida todos os campos do callback
- [ ] Usuários não-PRO não conseguem gerar relatórios
- [ ] Rate limiting por IP implementado (opcional)
- [ ] Logs não expõem dados sensíveis

### 7.2 Proteção contra Abusos

O sistema já implementa:
- ✅ Validação de assinatura PRO
- ✅ Cooldown de 24h entre tentativas
- ✅ Limite de 3 relatórios por mês
- ✅ Validação de dados suficientes
- ✅ Timeout de 30 minutos

## 8. Suporte

Em caso de dúvidas ou problemas:
1. Verifique logs do backend (`npm run dev`)
2. Verifique histórico de execuções no n8n
3. Consulte este guia para troubleshooting
4. Abra uma issue no repositório com logs relevantes
