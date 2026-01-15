# Roadmap - Octopus IA

## Implementado ✅
- [x] Sistema de autenticação (login, registro, recuperação de senha)
- [x] Dashboard financeiro com gráficos (6 meses no comparativo mensal)
- [x] Filtros de data (Hoje, 7 dias, 30 dias, Mês atual, Personalizado)
- [x] Refresh manual e automático dos dados
- [x] Alertas de IA (estrutura pronta)
- [x] Integração com n8n via PostgreSQL direto
- [x] Campos para vinculação de chat (chatId, chatUsername)
- [x] Favicon laranja personalizado
- [x] Mensagens de erro genéricas de login
- [x] Recuperação de senha via webhook n8n
- [x] **Sistema de Assinaturas** (none, basic, pro)
- [x] **Sistema de Preferências de Relatórios** (none, simple, advanced)
- [x] **Página de Configurações** (/settings)
  - Visualização de assinatura atual
  - Configuração de tipo de relatório
  - Validação: relatório avançado apenas para assinatura pro
  - Exibição da data do último relatório enviado

## Backlog - Futuras Implementações 📋

### 1. Rate Limiting
**Prioridade:** Alta (Segurança)
- Implementar rate limiting nos endpoints públicos
- Especialmente: login, registro, forgot-password
- Sugestão: express-rate-limit
- Proteger contra brute force e spam

### 2. Expansão da Página de Configurações
**Prioridade:** Média-Alta
> **Nota:** Página de Configurações já existe com sistema de assinatura e relatórios. Expandir com:

- **Alterar senha** (usuário logado)
  - Nova seção na página /settings
  - Validar senha atual antes de alterar
  - Enviar toast de confirmação

- **Gerenciar Chat**
  - Ver se tem chat vinculado (chatId, chatUsername)
  - Botão para desvincular chat
  - Mostrar data de vinculação

- **Preferências de Notificações**
  - Toggle: Receber avisos da IA pelo Telegram/WhatsApp
  - Toggle: Receber avisos da IA apenas no dashboard
  - Toggle: Receber avisos de metas (quando ultrapassar/atingir)

### 3. Exportação de Relatórios
**Prioridade:** Média
- Botão "Exportar" no dashboard
- Formatos suportados:
  - CSV (mais simples, para Excel)
  - Excel (XLSX) - biblioteca: exceljs
  - PDF (relatório formatado) - biblioteca: pdfkit ou puppeteer
- Filtros: período selecionado, tipo (entrada/saída), categoria
- Útil para contabilidade e auditorias

### 4. Metas Financeiras Mensais
**Prioridade:** Média
- Definir meta de gastos por mês
- Definir meta de receitas por mês
- Definir meta de saldo mínimo
- Visualização no dashboard:
  - Barra de progresso da meta
  - Percentual atingido
  - Dias restantes no mês
- Alertas quando:
  - Ultrapassar meta de gastos
  - Atingir meta de receitas
  - Saldo abaixo do mínimo definido
- Notificação via chat (se habilitado) + dashboard

## Nice to Have (Baixa Prioridade) 🎯
- Skeleton loaders nos gráficos (melhor UX)
- Paginação se volume de dados crescer muito
- Notificações Web Push no browser
- Logs estruturados (Winston/Pino) para debug em produção
- Helmet para headers de segurança
- Backup automático do banco

## Segurança para Produção 🔒
- [ ] Rate limiting implementado
- [ ] Helmet configurado
- [ ] CORS configurado corretamente
- [ ] Sanitização de inputs
- [ ] Logs de auditoria
- [ ] Backup automático

---

**Última atualização:** 2025-01-15
