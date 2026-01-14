# 🐙 Octopus IA – Finance Hub

**Seu dashboard financeiro pessoal integrado ao WhatsApp.**

Octopus IA é um **hub financeiro moderno, seguro e responsivo**, criado para centralizar o controle financeiro pessoal a partir de registros enviados via WhatsApp e visualizados em um dashboard estilo fintech.

Nada de planilhas.  
Nada de sistemas engessados.  
Aqui o usuário conversa. A IA organiza. O dashboard mostra.

---

## 🚀 Visão Geral

O Octopus IA foi projetado como a base de um **SaaS de controle financeiro pessoal**, com foco em simplicidade, clareza visual e automação.

O sistema permite:
- Registrar entradas e saídas financeiras via WhatsApp
- Armazenar os dados em banco estruturado
- Visualizar indicadores financeiros em tempo real
- Receber alertas e insights gerados por IA
- Acessar tudo por um painel web protegido por autenticação

---

## 🧠 Funcionamento (Fluxo Geral)

1. O usuário envia mensagens financeiras pelo WhatsApp  
   Exemplo:  
   > “Gastei 120 no mercado hoje”

2. O backend processa e armazena os dados no PostgreSQL

3. O dashboard consome essas informações e exibe:
   - KPIs financeiros
   - Gráficos e rankings
   - Alertas gerados por IA

4. O acesso ao painel é restrito a usuários autenticados

---

## 📊 Funcionalidades

### Dashboard Financeiro
- KPIs principais:
  - Saldo atual
  - Total de entradas
  - Total de saídas
  - Gastos do mês
  - Média mensal
  - Investimentos
- Cards compactos para maior densidade de informação

### Gráficos
- Evolução financeira ao longo do tempo
- Comparativo mensal dos últimos 6 meses
- Distribuição de gastos por categoria
- Evolução por categoria com seletor dinâmico
- Ranking de maiores gastos com scroll interno

### Avisos da IA
- Alertas financeiros automáticos
- Classificação por prioridade (baixa, média, alta)
- Exibição em carrossel compacto

### Autenticação
- Tela de login dedicada
- Rotas protegidas
- Controle de sessão
- Botão de logout no dashboard
- Redirecionamento automático para login

### Responsividade
- Desktop
- Tablet
- Mobile  
Interface adaptada para todos os tamanhos de tela.

---

## 🛠️ Stack Tecnológica

### Frontend
- React
- TypeScript
- Tailwind CSS
- Chart.js / Recharts
- Design system dark customizado

### Backend
- PostgreSQL
- Autenticação integrada
- Row Level Security (RLS)

---

## 🗄️ Estrutura do Banco de Dados

### finance_records
Armazena os registros financeiros dos usuários:
- valor
- tipo (entrada / saída)
- categoria
- data do comprovante
- timestamps

### ai_alerts
Armazena alertas e insights gerados pela IA:
- texto do aviso
- prioridade
- timestamps

### profiles
Dados de perfil do usuário autenticado:
- display_name
- vínculo com auth

Todas as tabelas utilizam **Row Level Security**, garantindo que cada usuário acesse apenas seus próprios dados.

---

## 🔒 Segurança

- Autenticação obrigatória
- Isolamento total de dados por usuário
- Rotas protegidas
- Nenhum dado financeiro é acessível sem login

---

## 📦 Estado Atual do Projeto

✔ Interface finalizada  
✔ Autenticação funcionando  
✔ Banco de dados estruturado  
✔ Gráficos dinâmicos  
✔ Responsividade ajustada  

🚧 Integração direta com WhatsApp não incluída neste repositório  
🚧 Camada de IA pode ser expandida

Este projeto serve como **base sólida para evolução de um SaaS financeiro completo**.

---

## 🧪 Modo Demonstração

- Caso não existam dados no banco, o sistema exibe estados vazios
- Gráficos mostram mensagens como “Sem dados disponíveis”
- Ideal para testes e apresentações

---

## 🎯 Objetivo do Projeto

Este repositório tem como objetivo:
- Demonstrar a arquitetura de um Finance Hub moderno
- Servir como base para um SaaS financeiro integrado ao WhatsApp
- Aplicar boas práticas de UI, UX e segurança
- Evoluir para um produto comercial

---

## 👤 Autor

**Thales Gomes**  @thalesgomes.ia
Automação, IA e Sistemas Inteligentes  

---
