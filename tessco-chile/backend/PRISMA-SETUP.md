# 🗄️ Configuración de Prisma - Tessco Chile

Esta guía específica te ayudará a configurar Prisma correctamente en cualquier máquina.

## 📋 Pasos Rápidos

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tu configuración de base de datos
```

### 3. Configurar Prisma
```bash
# Generar cliente
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Crear usuario admin
npm run create-admin
```

## 🔧 Comandos de Prisma

### Desarrollo
```bash
# Aplicar migraciones y crear base de datos
npx prisma migrate dev

# Ver base de datos en navegador
npx prisma studio

# Resetear base de datos (CUIDADO: borra datos)
npx prisma migrate reset
```

### Producción
```bash
# Solo aplicar migraciones existentes
npx prisma migrate deploy

# Generar cliente
npx prisma generate
```

## 🗃️ Estructura de la Base de Datos

### Tablas principales:
- `User` - Usuarios del sistema
- `Product` - Productos de la tienda
- `Category` - Categorías de productos
- `Brand` - Marcas de productos
- `Order` - Pedidos de clientes
- `OrderItem` - Items de pedidos

### Usuario administrador por defecto:
- **Email:** `giraldocarloscl@gmail.com`
- **Password:** `carlosvas12`
- **Rol:** `admin`

## 🐛 Problemas Comunes

### Error: "Database does not exist"
```bash
# Crear base de datos manualmente
sudo -u postgres psql
CREATE DATABASE tessco_chile;
\q
```

### Error: "Connection refused"
1. Verificar que PostgreSQL esté ejecutándose
2. Verificar configuración en `.env`
3. Verificar puerto 5432

### Error: "Migration failed"
```bash
# Ver estado de migraciones
npx prisma migrate status

# Aplicar migraciones manualmente
npx prisma migrate deploy
```

## 📊 Verificar Configuración

```bash
# Verificar conexión a base de datos
npx prisma db pull

# Ver esquema actual
npx prisma db push --preview-feature

# Abrir Prisma Studio
npx prisma studio
```

## 🔐 Seguridad

- Cambiar contraseña del administrador en producción
- Usar variables de entorno para credenciales
- No commitear archivos `.env`
- Usar JWT secrets seguros

---

Para más información, consulta la [documentación oficial de Prisma](https://www.prisma.io/docs/).


