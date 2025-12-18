// Cargar variables de entorno según el entorno
const fs = require('fs');
const path = require('path');
const nodeEnv = process.env.NODE_ENV || 'development';

// Intentar cargar .env.dev primero si estamos en desarrollo
if (nodeEnv === 'development') {
  const envDevPath = path.join(__dirname, '../../.env.dev');
  if (fs.existsSync(envDevPath)) {
    require('dotenv').config({ path: envDevPath });
  } else {
    require('dotenv').config();
  }
} else {
  // En producción, cargar .env
  require('dotenv').config();
}

// Frontend URL: Prioridad 1) FRONTEND_URL, 2) CORS_ORIGIN, 3) default
const frontendUrlFromEnv = process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000';

const corsOrigins = (process.env.CORS_ORIGIN || frontendUrlFromEnv)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const config = {
  // Server
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // URLs
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  frontendUrl: frontendUrlFromEnv.trim(),
  corsOrigins,
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  uploadPath: process.env.UPLOAD_PATH || './public/uploads',
  
  // Rate Limiting
  // Aumentado significativamente para permitir más peticiones antes de bloquear
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (nodeEnv === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000), // 1 min en dev, 15 min en prod
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (nodeEnv === 'development' ? 5000 : 2000), // 5000 en dev, 2000 en prod (aumentado de 100)
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME
  },
  
  // MercadoPago
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    clientId: process.env.MERCADOPAGO_CLIENT_ID,
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET
  },

  // Notifications
  notificationEmail: process.env.SALES_NOTIFICATION_EMAIL || process.env.FROM_EMAIL
};

// Validar variables requeridas
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno requeridas faltantes:', missingVars.join(', '));
  process.exit(1);
}

module.exports = config;
