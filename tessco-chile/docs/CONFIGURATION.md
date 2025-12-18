# 🔧 Configuración del Proyecto - Tessco Chile

## 📋 Variables de Entorno

### Backend (.env)

```bash
# Server
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
API_BASE_URL="http://localhost:4000"

# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/tessco_chile"

# JWT
JWT_SECRET="tu-secreto-super-seguro-aqui"
JWT_EXPIRES_IN="7d"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH="./public/uploads"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@tesscochile.cl"
FROM_NAME="Tessco Chile"

# MercadoPago (Opcional)
MERCADOPAGO_ACCESS_TOKEN="your-access-token"
MERCADOPAGO_PUBLIC_KEY="your-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-webhook-secret"
```

### Frontend (.env)

```bash
# URLs de la API
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_FRONTEND_URL=http://localhost:3000

# Configuración de la aplicación
REACT_APP_APP_NAME=Tessco Chile
REACT_APP_APP_VERSION=1.0.0
REACT_APP_APP_DESCRIPTION=Tu tienda de tecnología y accesorios

# Configuración de upload
REACT_APP_MAX_FILE_SIZE=5242880
REACT_APP_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Configuración de desarrollo
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=info
```

## 🚀 Configuración para Despliegue

### Desarrollo Local
```bash
# Backend
cd backend
cp env.example .env
# Editar .env con tus valores

# Frontend
cd frontend
# Crear .env con las variables de arriba
```

### Producción
```bash
# Backend
API_BASE_URL="https://api.tesscochile.cl"
CORS_ORIGIN="https://tesscochile.cl"
NODE_ENV="production"

# Frontend
REACT_APP_API_BASE_URL=https://api.tesscochile.cl
REACT_APP_FRONTEND_URL=https://tesscochile.cl
```

## 📁 Estructura de Configuración

```
backend/
├── src/config/
│   └── app.js          # Configuración centralizada del backend
├── .env                # Variables de entorno del backend
└── env.example         # Plantilla de variables

frontend/
├── src/config/
│   └── app.js          # Configuración centralizada del frontend
└── .env                # Variables de entorno del frontend
```

## 🔄 Uso en el Código

### Backend
```javascript
const config = require('./config/app');

// Usar configuración
app.listen(config.port);
console.log(`Servidor en ${config.apiBaseUrl}`);
```

### Frontend
```javascript
const config = require('./config/app');

// Usar configuración
const apiUrl = config.getApiUrl('/api/auth/login');
const imageUrl = config.getImageUrl('/uploads/product.jpg');
```

## ✅ Ventajas de esta Configuración

1. **Centralizada**: Todas las configuraciones en un solo lugar
2. **Flexible**: Fácil cambio entre entornos (desarrollo/producción)
3. **Segura**: Variables sensibles en archivos .env
4. **Mantenible**: Un solo lugar para cambiar URLs
5. **Escalable**: Fácil agregar nuevas configuraciones

## 🛠️ Comandos Útiles

```bash
# Crear usuario administrador
npm run create-admin

# Probar autenticación
npm run test-auth

# Probar upload de imágenes
npm run test-upload

# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm run start
```

## 🔍 Verificación

Para verificar que la configuración funciona correctamente:

1. **Backend**: Verifica que el servidor inicie sin errores
2. **Frontend**: Verifica que las peticiones a la API funcionen
3. **Upload**: Prueba subir una imagen desde el admin
4. **Auth**: Prueba login/logout desde el frontend

## 📝 Notas Importantes

- **Nunca** subas archivos `.env` al repositorio
- **Siempre** usa `env.example` como plantilla
- **Verifica** que todas las variables estén definidas
- **Usa** HTTPS en producción
- **Configura** CORS correctamente para tu dominio
