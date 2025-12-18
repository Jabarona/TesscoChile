#!/bin/bash

# Script de configuración inicial del proyecto Tessco Chile
echo "🚀 Configurando proyecto Tessco Chile..."

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

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi

print_message "Node.js $(node -v) detectado"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi

print_message "npm $(npm -v) detectado"

# Instalar dependencias del proyecto raíz
print_info "Instalando dependencias del proyecto raíz..."
npm install

# Instalar dependencias del frontend
print_info "Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

# Instalar dependencias del backend
print_info "Instalando dependencias del backend..."
cd backend
npm install
cd ..

# Crear archivo .env para el backend
if [ ! -f "backend/.env" ]; then
    print_info "Creando archivo .env para el backend..."
    cp backend/env.example backend/.env
    print_warning "Por favor configura las variables de entorno en backend/.env"
else
    print_message "Archivo .env del backend ya existe"
fi

# Crear directorios necesarios
print_info "Creando directorios necesarios..."
mkdir -p backend/uploads
mkdir -p frontend/dist
mkdir -p logs

# Configurar permisos
print_info "Configurando permisos..."
chmod +x scripts/*.sh

# Verificar si Docker está instalado
if command -v docker &> /dev/null; then
    print_message "Docker detectado"
    if command -v docker-compose &> /dev/null; then
        print_message "Docker Compose detectado"
        print_info "Para usar Docker, ejecuta: docker-compose up -d"
    else
        print_warning "Docker Compose no está instalado"
    fi
else
    print_warning "Docker no está instalado. Para desarrollo local, no es necesario."
fi

# Verificar si PostgreSQL está instalado
if command -v psql &> /dev/null; then
    print_message "PostgreSQL detectado"
else
    print_warning "PostgreSQL no está instalado. Necesario para el backend."
fi

print_message "Configuración completada!"
echo ""
print_info "Próximos pasos:"
echo "1. Configura las variables de entorno en backend/.env"
echo "2. Configura la base de datos PostgreSQL"
echo "3. Ejecuta: npm run db:migrate (para crear las tablas)"
echo "4. Ejecuta: npm run dev (para iniciar el desarrollo)"
echo ""
print_info "Comandos útiles:"
echo "- npm run dev          # Iniciar desarrollo"
echo "- npm run build        # Construir para producción"
echo "- npm run test         # Ejecutar tests"
echo "- npm run lint         # Verificar código"
echo "- docker-compose up    # Usar con Docker"
