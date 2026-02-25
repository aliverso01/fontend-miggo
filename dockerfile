# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Garante que o .env seja carregado pelo Vite (se estiver no local atual)
RUN if [ -f src/layout/.env ]; then cp src/layout/.env .env; fi
RUN npm run build

# Estágio de Servidor (Nginx)
FROM nginx:stable-alpine
# Copia o build (ajuste 'dist' para 'build' se necessário)
COPY --from=build /app/dist /usr/share/nginx/html
# Configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]