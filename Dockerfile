# /Dockerfile (root do projeto)
FROM node:20-alpine AS builder

WORKDIR /app

# Build args para variáveis de ambiente do Vite
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte (exceto server/)
COPY . .

# Build do Vite com a variável de ambiente
RUN npm run build

# Production image com Nginx
FROM nginx:alpine

# Copiar build do Vite para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
