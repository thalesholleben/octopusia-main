# /server/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar OpenSSL e dependências necessárias para o Prisma
RUN apk add --no-cache openssl libc6-compat

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL e dependências necessárias para o Prisma
RUN apk add --no-cache openssl libc6-compat

# Copiar node_modules e build do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Expor porta
EXPOSE 3001

# Rodar migrations e iniciar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
