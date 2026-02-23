# ===============================
# 🔨 BUILD STAGE
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app

# Variable de entorno para Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del proyecto
COPY . .

# Build de producción
RUN npm run build


# ===============================
# 🚀 PRODUCTION STAGE
# ===============================
FROM nginx:alpine

# Eliminamos config default de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el build generado
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponemos puerto 80
EXPOSE 80

# Ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]