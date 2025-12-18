const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { connectDatabase, disconnectDatabase } = require('./config/database');

const app = express();
const PORT = config.port;

// Middleware de seguridad
// Configurar helmet para permitir headers personalizados de webhooks (Mercado Pago)
app.use(helmet({
  contentSecurityPolicy: false, // Permitir contenido de terceros para webhooks
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permitir recursos cross-origin
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (e.g., herramientas internas, webhooks de Mercado Pago)
    if (!origin) {
      return callback(null, true);
    }

    // Permitir orígenes de Mercado Pago (necesario para webhooks)
    // Las IPs de Mercado Pago pueden variar, pero estas son las principales
    const mercadoPagoOrigins = [
      'https://www.mercadopago.com',
      'https://mercadopago.com',
      'https://www.mercadolibre.com',
      'https://mercadolibre.com'
    ];
    
    // Verificar si es un origen permitido en la configuración
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Verificar si es un origen de Mercado Pago (aunque generalmente no viene con origin)
    if (mercadoPagoOrigins.some(mpOrigin => origin.includes(mpOrigin.replace('https://', '')))) {
      return callback(null, true);
    }

    console.warn('🚫 CORS bloqueado para origen:', origin);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
}));

// Rate limiting
// En desarrollo, usar límites más altos; en producción, más restrictivos
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // En desarrollo, permitir más solicitudes (los límites ya están ajustados en config)
  skip: (req) => {
    // Opcional: deshabilitar completamente en desarrollo si es necesario
    // return config.nodeEnv === 'development';
    return false; // Usar los límites configurados (más altos en dev)
  }
});

// Aplicar rate limiting a todas las rutas excepto el webhook de Mercado Pago
// (los webhooks necesitan ser confiables y no deben estar limitados)
app.use('/api/', (req, res, next) => {
  // Excluir webhook de Mercado Pago del rate limiting
  if (req.path === '/payments/webhook' && req.method === 'POST') {
    return next();
  }
  // Aplicar rate limiting a todas las demás rutas
  limiter(req, res, next);
});

// Middleware para parsing
// No parsear JSON automáticamente para rutas que usan multer
app.use((req, res, next) => {
  // Si es una ruta que usa multer, no parsear como JSON
  if (req.path.includes('/products') && (req.method === 'POST' || req.method === 'PUT')) {
    return next();
  }
  // Para otras rutas, parsear como JSON
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
// Servir archivos estáticos con CORS
app.use('/uploads', (req, res, next) => {
  // Configurar headers CORS para imágenes
  const origin = req.headers.origin;
  if (origin && config.corsOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (config.frontendUrl) {
    res.header('Access-Control-Allow-Origin', config.frontendUrl);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Si es una petición OPTIONS, responder inmediatamente
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, express.static('public/uploads'));

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/settings', require('./routes/settings'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Ruta no encontrada',
      path: req.originalUrl
    }
  });
});

// Iniciar servidor
async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📊 Entorno: ${config.nodeEnv}`);
      console.log(`🌐 URL: ${config.apiBaseUrl}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();
