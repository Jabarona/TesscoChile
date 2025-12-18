#!/bin/bash

# Script para configurar el proyecto Tessco Chile en una nueva máquina
# Uso: ./scripts/setup-new-machine.sh

echo "🚀 Configurando Tessco Chile en nueva máquina..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto Tessco Chile"
    exit 1
fi

print_status "Iniciando configuración del proyecto..."

# 1. Instalar dependencias del backend
print_status "Instalando dependencias del backend..."
cd backend
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencias del backend instaladas correctamente"
    else
        print_error "Error instalando dependencias del backend"
        exit 1
    fi
else
    print_error "No se encontró package.json en el directorio backend"
    exit 1
fi

# 2. Configurar variables de entorno
print_status "Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Archivo .env creado desde .env.example"
        print_warning "IMPORTANTE: Edita el archivo .env con tus configuraciones específicas"
    else
        print_error "No se encontró .env.example en el directorio backend"
        exit 1
    fi
else
    print_warning "El archivo .env ya existe, no se sobrescribirá"
fi

# 3. Configurar Prisma
print_status "Configurando Prisma..."
if command -v npx &> /dev/null; then
    # Generar cliente de Prisma
    npx prisma generate
    if [ $? -eq 0 ]; then
        print_success "Cliente de Prisma generado correctamente"
    else
        print_error "Error generando cliente de Prisma"
        exit 1
    fi
    
    # Aplicar migraciones
    print_status "Aplicando migraciones de la base de datos..."
    npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        print_success "Migraciones aplicadas correctamente"
    else
        print_error "Error aplicando migraciones"
        print_warning "Si es la primera vez, ejecuta: npx prisma migrate dev"
        exit 1
    fi
    
    # Crear usuario administrador
    print_status "Creando usuario administrador..."
    npm run create-admin
    if [ $? -eq 0 ]; then
        print_success "Usuario administrador creado correctamente"
    else
        print_warning "Error creando usuario administrador (puede que ya exista)"
    fi
else
    print_error "npx no está disponible. Instala Node.js y npm primero"
    exit 1
fi

# 4. Instalar dependencias del frontend
print_status "Instalando dependencias del frontend..."
cd ../frontend
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencias del frontend instaladas correctamente"
    else
        print_error "Error instalando dependencias del frontend"
        exit 1
    fi
else
    print_error "No se encontró package.json en el directorio frontend"
    exit 1
fi

# 5. Volver al directorio raíz
cd ..

print_success "🎉 Configuración completada!"
echo ""
print_status "Próximos pasos:"
echo "1. Edita backend/.env con tu configuración de base de datos"
echo "2. Ejecuta: cd backend && npm run dev"
echo "3. En otra terminal: cd frontend && npm start"
echo "4. Visita: http://localhost:3000"
echo ""
print_status "Credenciales de administrador:"
echo "Email: giraldocarloscl@gmail.com"
echo "Password: carlosvas12"
echo ""
print_warning "IMPORTANTE: Cambia la contraseña del administrador en producción!"


