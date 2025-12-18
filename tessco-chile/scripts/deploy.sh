#!/bin/bash

# Script de despliegue para Tessco Chile
echo "🚀 Desplegando Tessco Chile..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar argumentos
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

print_info "Desplegando en entorno: $ENVIRONMENT"
print_info "Versión: $VERSION"

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Necesario para el despliegue."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Necesario para el despliegue."
    exit 1
fi

# Construir imágenes
print_info "Construyendo imágenes de Docker..."
docker-compose build

if [ $? -ne 0 ]; then
    print_error "Error construyendo las imágenes"
    exit 1
fi

# Detener contenedores existentes
print_info "Deteniendo contenedores existentes..."
docker-compose down

# Iniciar servicios
print_info "Iniciando servicios..."
docker-compose up -d

if [ $? -ne 0 ]; then
    print_error "Error iniciando los servicios"
    exit 1
fi

# Esperar a que los servicios estén listos
print_info "Esperando a que los servicios estén listos..."
sleep 30

# Verificar salud de los servicios
print_info "Verificando salud de los servicios..."

# Verificar frontend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_message "Frontend está funcionando"
else
    print_warning "Frontend no responde correctamente"
fi

# Verificar backend
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    print_message "Backend está funcionando"
else
    print_warning "Backend no responde correctamente"
fi

# Ejecutar migraciones de base de datos
print_info "Ejecutando migraciones de base de datos..."
docker-compose exec backend npx prisma migrate deploy

if [ $? -ne 0 ]; then
    print_warning "Error ejecutando migraciones. Verifica la conexión a la base de datos."
fi

# Ejecutar seed de datos
print_info "Ejecutando seed de datos..."
docker-compose exec backend npx prisma db seed

if [ $? -ne 0 ]; then
    print_warning "Error ejecutando seed. Los datos iniciales podrían no estar disponibles."
fi

# Mostrar estado de los contenedores
print_info "Estado de los contenedores:"
docker-compose ps

print_message "Despliegue completado!"
echo ""
print_info "Servicios disponibles:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:4000"
echo "- Base de datos: localhost:5432"
echo ""
print_info "Comandos útiles:"
echo "- docker-compose logs -f          # Ver logs en tiempo real"
echo "- docker-compose down             # Detener servicios"
echo "- docker-compose restart          # Reiniciar servicios"
echo "- docker-compose exec backend sh  # Acceder al contenedor del backend"
