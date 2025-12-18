# Dockerfile para el backend
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache openssl

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 4000

# Comando para desarrollo
CMD ["npm", "run", "dev"]
