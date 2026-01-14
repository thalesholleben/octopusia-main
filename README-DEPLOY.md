# 🚀 Deploy no EasyPanel - Octopusia Dashboard

## Pré-requisitos
- PostgreSQL e n8n já instalados na VPS via EasyPanel
- Docker e docker-compose instalados na VPS
- Acesso SSH à VPS
- Git instalado na VPS

---

## 📋 Passo a Passo

### **Passo 1: Clonar o repositório na VPS**
```bash
git clone <seu-repositorio-git>
cd octopusia-main
```

### **Passo 2: Configurar variáveis de ambiente**
```bash
cp .env.example .env
nano .env  # Ou use vim/vi
```

**Configurações importantes no `.env`:**

```env
# PostgreSQL existente no EasyPanel
DATABASE_URL="postgresql://seu_user:sua_senha@host_postgres:5432/octopusia?schema=public"

# Gerar JWT Secret seguro (rode: openssl rand -base64 32)
JWT_SECRET=<cole_o_secret_gerado>

# URLs de produção
FRONTEND_URL=https://seu-dominio.com
VITE_API_URL=https://seu-dominio.com:3001/api

# Backend config
PORT=3001
NODE_ENV=production
JWT_EXPIRES_IN=7d
```

**Importante:**
- Substitua `host_postgres` pelo host real do PostgreSQL no EasyPanel
- Gere um JWT_SECRET forte: `openssl rand -base64 32`
- Use URLs HTTPS em produção

### **Passo 3: Build e iniciar os containers**
```bash
docker-compose up -d --build
```

Isso irá:
1. Buildar a imagem do backend
2. Buildar a imagem do frontend
3. Iniciar os containers em background

### **Passo 4: Rodar migrations do Prisma**
```bash
docker-compose exec backend npx prisma migrate deploy
```

Isso criará as tabelas no PostgreSQL:
- `users` (autenticação)
- `finance_records` (registros financeiros do n8n)
- `ai_alerts` (alertas)

### **Passo 5: Verificar status**
```bash
# Ver status dos containers
docker-compose ps

# Ver logs do backend
docker-compose logs -f backend

# Ver logs do frontend
docker-compose logs -f frontend

# Verificar health check
curl http://localhost:3001/api/health
```

---

## 🌐 Acessar a aplicação

- **Frontend:** http://seu-dominio.com (porta 80)
- **Backend API:** http://seu-dominio.com:3001/api
- **Health check:** http://seu-dominio.com:3001/api/health

---

## 🛠 Comandos úteis

### Gerenciar containers
```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f backend

# Parar containers
docker-compose down

# Rebuild após mudanças no código
docker-compose up -d --build

# Restart de um serviço específico
docker-compose restart backend
```

### Gerenciar banco de dados
```bash
# Abrir Prisma Studio (GUI para o banco)
docker-compose exec backend npx prisma studio

# Acessar console do PostgreSQL (se usar o container)
docker-compose exec postgres psql -U octopusia -d octopusia

# Rodar migrations manualmente
docker-compose exec backend npx prisma migrate deploy

# Resetar banco (CUIDADO - apaga tudo!)
docker-compose exec backend npx prisma migrate reset
```

### Debug e troubleshooting
```bash
# Entrar no container do backend
docker-compose exec backend sh

# Ver variáveis de ambiente
docker-compose exec backend env

# Testar conexão com o banco
docker-compose exec backend npx prisma db pull
```

---

## 🔧 Integração com PostgreSQL existente no EasyPanel

Se você já tem PostgreSQL rodando no EasyPanel:

1. **Não use o serviço postgres do docker-compose**
   - O `docker-compose.yml` atual não tem o serviço postgres
   - O backend vai conectar direto no Postgres do EasyPanel

2. **Configure o DATABASE_URL corretamente**
   ```env
   DATABASE_URL="postgresql://user:senha@host:5432/octopusia?schema=public"
   ```
   - `host`: IP interno ou hostname do Postgres no EasyPanel
   - `user`: Usuário do PostgreSQL
   - `senha`: Senha do PostgreSQL
   - `octopusia`: Nome do database (crie se não existir)

3. **Criar o database se necessário**
   ```bash
   # Conectar no PostgreSQL existente
   psql -h host -U user -d postgres

   # Criar o database
   CREATE DATABASE octopusia;
   ```

4. **Rodar migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

---

## 📝 Estrutura do n8n

O n8n já está alimentando o PostgreSQL com dados financeiros. O backend da Octopusia apenas **LÊ** esses dados:

- **Tabela `finance_records`**: Registros financeiros inseridos pelo n8n
- **Tabela `users`**: Usuários criados pelo dashboard (autenticação)
- **Tabela `ai_alerts`**: Alertas (futuramente gerados por IA)

**Importante:** O n8n deve continuar inserindo dados na tabela `finance_records` normalmente. O backend não escreve nessa tabela, apenas consulta.

---

## 🔐 Segurança

### JWT Secret
- **NUNCA** use o JWT_SECRET padrão em produção
- Gere um novo: `openssl rand -base64 32`
- Mantenha seguro no `.env`

### HTTPS
Em produção, configure HTTPS no EasyPanel ou use um proxy reverso (Nginx/Traefik):
```nginx
server {
    listen 443 ssl;
    server_name seu-dominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

### Firewall
Abra apenas as portas necessárias:
- **80** (HTTP frontend)
- **443** (HTTPS)
- **3001** (Backend API - se expor publicamente)

---

## 🐛 Troubleshooting Comum

### Erro: "Error connecting to database"
```bash
# Verificar DATABASE_URL no .env
docker-compose exec backend env | grep DATABASE_URL

# Testar conexão manualmente
docker-compose exec backend npx prisma db pull
```

**Solução:** Corrija o `DATABASE_URL` no `.env` e reinicie:
```bash
docker-compose restart backend
```

### Erro: "JWT invalid"
- Limpe o localStorage do navegador
- Faça login novamente
- Verifique se o `JWT_SECRET` é o mesmo em todos os containers

### Erro: "CORS error"
- Verifique `FRONTEND_URL` no backend `.env`
- Verifique `VITE_API_URL` no frontend
- Certifique-se de que as URLs correspondem

### Containers não sobem
```bash
# Ver logs detalhados
docker-compose logs

# Ver erro específico de um serviço
docker-compose logs backend
```

### Migrations não rodam
```bash
# Rodar manualmente
docker-compose exec backend npx prisma migrate deploy

# Se falhar, verificar se o banco existe
docker-compose exec backend npx prisma db push
```

### Frontend não carrega
- Verifique se o build do Vite foi feito corretamente
- Verifique logs: `docker-compose logs frontend`
- Teste o health check: `curl http://localhost:3001/api/health`

---

## 🔄 Atualizações e Deploy Contínuo

Após fazer mudanças no código:

```bash
# 1. Pull das mudanças
git pull origin main

# 2. Rebuild dos containers
docker-compose up -d --build

# 3. Rodar migrations (se houver)
docker-compose exec backend npx prisma migrate deploy

# 4. Verificar logs
docker-compose logs -f
```

---

## 📊 Monitoramento

### Logs
```bash
# Todos os logs
docker-compose logs -f

# Últimas 100 linhas
docker-compose logs --tail=100

# Logs com timestamp
docker-compose logs -f -t
```

### Health Check
O backend tem um endpoint de health check:
```bash
curl http://localhost:3001/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"2026-01-14T..."}
```

### Recursos do container
```bash
# Ver uso de CPU e memória
docker stats

# Ver apenas do backend
docker stats octopusia-backend
```

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Verifique o health check: `curl http://localhost:3001/api/health`
3. Verifique o `.env` (DATABASE_URL, JWT_SECRET, etc)
4. Teste a conexão com o banco: `npx prisma db pull`

---

**✅ Deploy concluído com sucesso!** 🎉

Acesse seu dashboard e comece a usar: https://seu-dominio.com
