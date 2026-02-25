# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Servidor (Nginx)
FROM nginx:stable-alpine
# Copia o build (ajuste 'dist' para 'build' se necessário)
COPY --from=build /app/dist /usr/share/nginx/html
# Configuração básica para React Router funcionar
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]