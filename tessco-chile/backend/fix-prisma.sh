#!/bin/bash

# Script para limpiar y regenerar Prisma Client
echo "🔧 Limpiando Prisma Client..."

# Intentar eliminar la carpeta .prisma
PRISMA_PATH="node_modules/.prisma"
if [ -d "$PRISMA_PATH" ]; then
    echo "Eliminando carpeta .prisma..."
    rm -rf "$PRISMA_PATH"
    if [ $? -eq 0 ]; then
        echo "✅ Carpeta .prisma eliminada correctamente"
    else
        echo "⚠️  No se pudo eliminar la carpeta .prisma (puede estar en uso)"
        echo "   Asegúrate de cerrar Prisma Studio y cualquier proceso Node.js"
        exit 1
    fi
else
    echo "No se encontró la carpeta .prisma"
fi

# Regenerar Prisma Client
echo ""
echo "🔄 Regenerando Prisma Client..."
npm run db:generate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Prisma Client regenerado correctamente!"
    echo "Ahora puedes ejecutar: npm run db:studio"
else
    echo ""
    echo "❌ Error al regenerar Prisma Client"
    exit 1
fi

