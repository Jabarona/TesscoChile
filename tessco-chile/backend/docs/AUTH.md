# Sistema de Autenticación - Tessco Chile

## Descripción

Sistema completo de autenticación JWT para la API de Tessco Chile, incluyendo registro, login, verificación de roles y gestión de usuarios.

## Características

- ✅ Registro de usuarios con validación
- ✅ Inicio de sesión con JWT
- ✅ Middleware de autenticación
- ✅ Verificación de roles (user/admin)
- ✅ Cambio de contraseña
- ✅ Usuario administrador predefinido
- ✅ Validación de datos de entrada
- ✅ Encriptación de contraseñas con bcrypt

## Endpoints Disponibles

### POST /api/auth/register
Registra un nuevo usuario en el sistema.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+56912345678" // opcional
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "+56912345678",
      "role": "user",
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /api/auth/login
Inicia sesión con email y contraseña.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "user": {
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "user",
      "isVerified": false
    },
    "token": "jwt_token_here"
  }
}
```

### GET /api/auth/me
Obtiene información del usuario autenticado.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "user",
      "isVerified": false
    }
  }
}
```

### POST /api/auth/logout
Cierra la sesión del usuario (solo para logging).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

### PUT /api/auth/change-password
Cambia la contraseña del usuario autenticado.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Body:**
```json
{
  "currentPassword": "password_actual",
  "newPassword": "nueva_password123"
}
```

## Usuario Administrador

Se ha creado un usuario administrador predefinido con las siguientes credenciales:

- **Email:** giraldocarloscl@gmail.com
- **Contraseña:** carlosvas12
- **Rol:** admin
- **Verificado:** true

### Crear/Actualizar Usuario Admin

Para crear o actualizar el usuario administrador, ejecuta:

```bash
npm run create-admin
```

## Configuración

### Variables de Entorno Requeridas

```env
# JWT
JWT_SECRET="tu-clave-secreta-jwt"
JWT_EXPIRES_IN="7d"

# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/tessco_chile"
```

### Instalación de Dependencias

```bash
npm install
```

### Configuración de Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Crear usuario administrador
npm run create-admin
```

## Testing

Para probar el sistema de autenticación:

```bash
# Instalar dependencias de desarrollo
npm install

# Ejecutar pruebas de autenticación
npm run test-auth
```

## Middleware de Autenticación

### authenticateToken
Verifica que el usuario esté autenticado y agrega la información del usuario a `req.user`.

```javascript
const { authenticateToken } = require('./middleware/auth');

app.get('/protected-route', authenticateToken, (req, res) => {
  // req.user contiene la información del usuario
  res.json({ user: req.user });
});
```

### requireRole(role)
Verifica que el usuario tenga un rol específico.

```javascript
const { requireRole } = require('./middleware/auth');

app.get('/admin-only', requireRole('admin'), (req, res) => {
  res.json({ message: 'Solo administradores' });
});
```

### requireAdmin
Verifica que el usuario sea administrador.

```javascript
const { requireAdmin } = require('./middleware/auth');

app.get('/admin-route', requireAdmin, (req, res) => {
  res.json({ message: 'Ruta de administrador' });
});
```

## Seguridad

- Las contraseñas se encriptan con bcrypt (12 salt rounds)
- Los tokens JWT tienen expiración configurable
- Validación de datos de entrada con express-validator
- Rate limiting en todas las rutas de la API
- Headers de seguridad con helmet

## Códigos de Error

- **400:** Datos de entrada inválidos
- **401:** No autenticado o credenciales inválidas
- **403:** Acceso denegado (permisos insuficientes)
- **409:** Usuario ya existe
- **500:** Error interno del servidor

## Estructura de Respuestas

Todas las respuestas siguen el formato:

```json
{
  "success": true|false,
  "message": "Mensaje descriptivo",
  "data": { /* datos opcionales */ },
  "errors": [ /* errores de validación opcionales */ ]
}
```
