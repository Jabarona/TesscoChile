# 🚀 Guía para Configurar Tessco Chile en una Nueva Máquina

Esta guía te ayudará a configurar el proyecto Tessco Chile en una computadora nueva desde cero.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 16 o superior)
- **npm** (viene con Node.js)
- **PostgreSQL** (versión 12 o superior)
- **Git** (para clonar el repositorio)

### Verificar instalaciones:

```bash
node --version
npm --version
psql --version
git --version
```

## 🗄️ Configuración de la Base de Datos

### 1. Instalar PostgreSQL

**En Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**En macOS (con Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**En Windows:**
- Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
- Instalar y configurar

### 2. Crear base de datos

```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE tessco_chile;

# Crear usuario (opcional, puedes usar postgres)
CREATE USER tessco_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE tessco_chile TO tessco_user;

# Salir
\q
```

## 📥 Clonar y Configurar el Proyecto

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd giraldoSA-tessco-chile
```

### 2. Configurar variables de entorno

```bash
cd backend
cp .env.example .env
```

Edita el archivo `.env` con tu configuración:

```env
# Base de datos
DATABASE_URL="postgresql://tessco_user:tu_password_seguro@localhost:5432/tessco_chile"

# JWT
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"

# Servidor
PORT=4000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# API
API_BASE_URL=http://localhost:4000
```

### 3. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 🔧 Configuración de Prisma

### 1. Generar cliente de Prisma

```bash
cd backend
npx prisma generate
```

### 2. Aplicar migraciones

**Para desarrollo (primera vez):**
```bash
npx prisma migrate dev
```

**Para producción:**
```bash
npx prisma migrate deploy
```

### 3. Crear usuario administrador

```bash
npm run create-admin
```

## 🚀 Ejecutar el Proyecto

### 1. Iniciar el backend

```bash
cd backend
npm run dev
```

### 2. Iniciar el frontend (en otra terminal)

```bash
cd frontend
npm start
```

### 3. Verificar que todo funciona

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Admin Panel:** http://localhost:3000/admin

## 🔐 Credenciales de Acceso

**Administrador:**
- Email: `giraldocarloscl@gmail.com`
- Password: `carlosvas12`

⚠️ **IMPORTANTE:** Cambia estas credenciales en producción.

## 🛠️ Script de Configuración Automática

Para facilitar el proceso, puedes usar el script incluido:

```bash
./scripts/setup-new-machine.sh
```

Este script:
- Instala todas las dependencias
- Configura las variables de entorno
- Configura Prisma
- Crea el usuario administrador

## 🐛 Solución de Problemas

### Error: "Database does not exist"

```bash
# Crear la base de datos manualmente
sudo -u postgres psql
CREATE DATABASE tessco_chile;
\q
```

### Error: "Connection refused"

1. Verifica que PostgreSQL esté ejecutándose
2. Verifica la configuración en `.env`
3. Verifica que el puerto 5432 esté disponible

### Error: "Prisma client not generated"

```bash
cd backend
npx prisma generate
```

### Error: "Migration failed"

```bash
# Resetear la base de datos (CUIDADO: borra todos los datos)
cd backend
npx prisma migrate reset

# O aplicar migraciones manualmente
npx prisma migrate deploy
```

## 📁 Estructura del Proyecto

```
giraldoSA-tessco-chile/
├── backend/                 # API y base de datos
│   ├── prisma/             # Esquemas y migraciones
│   ├── src/                # Código fuente del backend
│   └── .env                # Variables de entorno
├── frontend/               # Interfaz de usuario
│   ├── src/                # Código fuente del frontend
│   └── package.json
├── scripts/                # Scripts de utilidad
└── docs/                   # Documentación
```

## 🔄 Comandos Útiles

```bash
# Ver estado de la base de datos
npx prisma studio

# Resetear base de datos
npx prisma migrate reset

# Aplicar migraciones
npx prisma migrate deploy

# Generar cliente
npx prisma generate

# Ver logs de Prisma
npx prisma migrate status
```

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en la consola
2. Verifica la configuración de la base de datos
3. Asegúrate de que todas las dependencias estén instaladas
4. Revisa que los puertos 3000 y 4000 estén disponibles

---

¡Listo! Tu proyecto Tessco Chile debería estar funcionando correctamente. 🎉


