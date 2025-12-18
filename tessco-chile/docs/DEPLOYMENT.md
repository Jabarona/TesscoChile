# Guía de Despliegue - Tessco Chile

## Requisitos del Sistema

### Desarrollo Local
- Node.js 18+ 
- npm 8+
- PostgreSQL 15+
- Redis 7+ (opcional)

### Producción
- Docker 20+
- Docker Compose 2+
- Nginx (opcional, para proxy reverso)
- SSL Certificate (para HTTPS)

## Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tessco-chile/ecommerce.git
cd ecommerce
```

### 2. Ejecutar Script de Configuración
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Configurar Variables de Entorno

#### Backend (.env)
```bash
cp backend/env.example backend/.env
```

Editar `backend/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tessco_chile?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server URLs (importante para producción)
API_BASE_URL="http://localhost:4000"  # En producción: "https://api.tesscochile.cl"
CORS_ORIGIN="http://localhost:3000"   # En producción: "https://tesscochile.cl"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
MERCADOPAGO_PUBLIC_KEY="your-mercadopago-public-key"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

#### Frontend (.env)
```bash
cp frontend/env.example frontend/.env
```

Editar `frontend/.env`:
```env
# URLs de la API y Frontend
# En desarrollo:
API_BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
PORT=3000

# En producción, usar las URLs reales:
# API_BASE_URL=https://api.tesscochile.cl
# FRONTEND_URL=https://tesscochile.cl
# PORT=3000
```

**⚠️ IMPORTANTE**: Las variables de entorno del frontend se inyectan automáticamente en el HTML cuando se sirve. Asegúrate de que:
- `API_BASE_URL` apunte a la URL de tu backend
- `FRONTEND_URL` apunte a la URL de tu frontend
- Ambas URLs coincidan con las configuradas en el backend (`CORS_ORIGIN`)

## Despliegue con Docker

### 1. Despliegue Completo
```bash
# Construir y ejecutar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 2. Servicios Individuales
```bash
# Solo base de datos
docker-compose up -d postgres redis

# Solo backend
docker-compose up -d backend

# Solo frontend
docker-compose up -d frontend
```

### 3. Script de Despliegue
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production v1.0.0
```

## Despliegue Manual

### 1. Base de Datos
```bash
# Crear base de datos
createdb tessco_chile

# Ejecutar migraciones
cd backend
npx prisma migrate deploy

# Ejecutar seed
npx prisma db seed
```

### 2. Backend
```bash
cd backend
npm install
npm run build
npm start
```

### 3. Frontend
```bash
cd frontend
npm install
npm run build
npm start
```

## Configuración de Producción

### 1. Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name tesscochile.cl www.tesscochile.cl;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. SSL con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tesscochile.cl -d www.tesscochile.cl

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Variables de Entorno de Producción

#### Backend (.env)
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/tessco_chile"
API_BASE_URL="https://api.tesscochile.cl"
CORS_ORIGIN="https://tesscochile.cl"
JWT_SECRET="tu-secreto-super-seguro-de-produccion"
MERCADOPAGO_ACCESS_TOKEN="prod_access_token"
```

#### Frontend (.env)
```env
API_BASE_URL=https://api.tesscochile.cl
FRONTEND_URL=https://tesscochile.cl
PORT=3000
```

**Nota sobre las imágenes**: Las imágenes se guardan en `backend/public/uploads/` y se sirven a través de la ruta `/uploads`. En producción, asegúrate de que:
1. El directorio `backend/public/uploads` tenga permisos de escritura
2. Las imágenes se sirvan correctamente a través de Nginx o el servidor de archivos estáticos
3. Las URLs de las imágenes en la base de datos sean relativas (`/uploads/products/...`) para que funcionen tanto en desarrollo como en producción

## Monitoreo y Logs

### 1. Logs de Aplicación
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Archivos
tail -f logs/app.log
tail -f logs/error.log
```

### 2. Monitoreo de Base de Datos
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U tessco_user -d tessco_chile

# Verificar conexiones
SELECT * FROM pg_stat_activity;
```

### 3. Health Checks
```bash
# Backend
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000/health
```

## Backup y Recuperación

### 1. Backup de Base de Datos
```bash
# Backup completo
docker-compose exec postgres pg_dump -U tessco_user tessco_chile > backup.sql

# Backup con compresión
docker-compose exec postgres pg_dump -U tessco_user tessco_chile | gzip > backup.sql.gz
```

### 2. Restaurar Base de Datos
```bash
# Desde archivo
docker-compose exec -T postgres psql -U tessco_user tessco_chile < backup.sql

# Desde archivo comprimido
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U tessco_user tessco_chile
```

## Escalabilidad

### 1. Escalar Servicios
```bash
# Escalar backend
docker-compose up -d --scale backend=3

# Escalar frontend
docker-compose up -d --scale frontend=2
```

### 2. Load Balancer
```nginx
upstream backend {
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
}
```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Reiniciar servicio
docker-compose restart postgres
```

#### 2. Error de Permisos
```bash
# Verificar permisos de archivos
ls -la scripts/

# Dar permisos de ejecución
chmod +x scripts/*.sh
```

#### 3. Puerto en Uso
```bash
# Verificar puertos en uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Cambiar puertos en docker-compose.yml
```

### Logs de Debug
```bash
# Habilitar logs detallados
export DEBUG=*
docker-compose up
```

## Mantenimiento

### 1. Actualizaciones
```bash
# Actualizar dependencias
npm update

# Reconstruir imágenes
docker-compose build --no-cache

# Aplicar migraciones
docker-compose exec backend npx prisma migrate deploy
```

### 2. Limpieza
```bash
# Limpiar contenedores parados
docker-compose down
docker system prune -f

# Limpiar volúmenes no utilizados
docker volume prune -f
```

### 3. Monitoreo de Recursos
```bash
# Uso de recursos
docker stats

# Espacio en disco
df -h
du -sh /var/lib/docker
```
