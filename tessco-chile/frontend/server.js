// Cargar variables de entorno según el entorno
const fs = require('fs');
const path = require('path');
const nodeEnv = process.env.NODE_ENV || 'development';

// Intentar cargar .env.dev primero si estamos en desarrollo
if (nodeEnv === 'development') {
  const envDevPath = path.join(__dirname, '.env.dev');
  if (fs.existsSync(envDevPath)) {
    require('dotenv').config({ path: envDevPath });
  } else {
    require('dotenv').config();
  }
} else {
  // En producción, cargar .env
  require('dotenv').config();
}

const http = require('http');

// Importar fetch para Node.js
const fetch = require('node-fetch');

// Configuración del servidor (puede usar variables de entorno)
const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://giraldosa-tessco-chile-production.up.railway.app',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  port: process.env.PORT || 3000
};

// Función para mostrar logs del frontend en la terminal
function logFrontend(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelEmoji = {
    'log': '📝',
    'info': 'ℹ️',
    'warn': '⚠️',
    'error': '❌',
    'success': '✅',
    'auth': '🔐',
    'debug': '🐛'
  };
  
  const emoji = levelEmoji[level] || '📝';
  console.log(`${emoji} [FRONTEND] ${timestamp} - ${message}`);
  
  if (data) {
    console.log('   📊 Datos:', JSON.stringify(data, null, 2));
  }
}

const server = http.createServer(async (req, res) => {
  let filePath = '.' + req.url;
  
  // Limpiar parámetros de URL (quitar ? y todo lo que sigue)
  if (filePath.includes('?')) {
    filePath = filePath.split('?')[0];
  }
  
  // Ruta especial para recibir logs del frontend
  if (req.method === 'POST' && req.url === '/api/log') {
    console.log('📨 Recibiendo log del frontend...');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const logData = JSON.parse(body);
        console.log('📝 Procesando log:', logData.level, logData.message);
        logFrontend(logData.level || 'log', logData.message, logData.data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('❌ Error procesando log del frontend:', error.message);
        logFrontend('error', 'Error procesando log del frontend', { error: error.message, body });
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  console.log(`📁 Solicitud: ${req.url} -> ${filePath}`);
  
  // Manejar archivos estáticos primero
  if (filePath.startsWith('./assets/')) {
    filePath = './src' + filePath.substring(1); // Quitar el primer punto
    console.log(`📦 Archivo estático: ${filePath}`);
  }
  // Manejar archivos CSS, JS, imágenes directamente
  else if (filePath.startsWith('./css/') || filePath.startsWith('./js/') || filePath.startsWith('./images/')) {
    // Extraer la ruta después del primer slash para evitar duplicar el punto
    const assetPath = filePath.substring(1); // Quita el punto inicial
    filePath = './src/assets' + assetPath;
    console.log(`📦 Archivo de assets: ${filePath}`);
  }
  // Manejar archivos de configuración
  else if (filePath.startsWith('./config/')) {
    filePath = './src' + filePath.substring(1); // Quitar el primer punto
    console.log(`⚙️ Archivo de configuración: ${filePath}`);
  }
  // Manejar archivos de componentes
  else if (filePath.startsWith('./components/')) {
    filePath = './src' + filePath.substring(1); // Quitar el primer punto
    console.log(`🧩 Archivo de componente: ${filePath}`);
  }
  // Página principal - Redirige a la tienda
  else if (filePath === './' || filePath === './index.html') {
    filePath = './src/pages/shop/index.html';
    console.log(`🛍️ Página principal (Tienda): ${filePath}`);
  }
  // Rutas de páginas
  else if (filePath === './home' || filePath === './inicio' || filePath.startsWith('./home')) {
    filePath = './src/pages/home/index.html';
    console.log(`🏠 Home: ${filePath}`);
  }
  else if (filePath === './shop' || filePath === './tienda' || filePath.startsWith('./shop')) {
    filePath = './src/pages/shop/index.html';
    console.log(`🛍️ Tienda: ${filePath}`);
  }
  else if (filePath === './product' || filePath === './producto' || filePath.startsWith('./product')) {
    filePath = './src/pages/product/index.html';
    console.log(`📦 Producto: ${filePath}`);
  }
  else if (filePath === './cart' || filePath === './carrito' || filePath.startsWith('./cart')) {
    filePath = './src/pages/cart/index.html';
    console.log(`🛒 Carrito: ${filePath}`);
  }
  else if (filePath === './checkout' || filePath.startsWith('./checkout')) {
    if (filePath === './checkout/success' || filePath.startsWith('./checkout/success')) {
      filePath = './src/pages/checkout/success.html';
      console.log(`✅ Checkout Success: ${filePath}`);
    } else if (filePath === './checkout/failure' || filePath.startsWith('./checkout/failure')) {
      filePath = './src/pages/checkout/failure.html';
      console.log(`❌ Checkout Failure: ${filePath}`);
    } else if (filePath === './checkout/pending' || filePath.startsWith('./checkout/pending')) {
      filePath = './src/pages/checkout/pending.html';
      console.log(`⏳ Checkout Pending: ${filePath}`);
    } else {
      filePath = './src/pages/checkout/index.html';
      console.log(`💳 Checkout: ${filePath}`);
    }
  }
  else if (filePath === './login' || filePath.startsWith('./login')) {
    filePath = './src/pages/auth/login.html';
    console.log(`🔐 Login: ${filePath}`);
  }
  else if (filePath === './register' || filePath === './registro' || filePath.startsWith('./register')) {
    filePath = './src/pages/auth/register.html';
    console.log(`📝 Registro: ${filePath}`);
  }
  else if (filePath === './profile' || filePath === './perfil' || filePath.startsWith('./profile')) {
    filePath = './src/pages/user/profile.html';
    console.log(`👤 Perfil: ${filePath}`);
  }
  else if (filePath === './contact' || filePath === './contacto' || filePath.startsWith('./contact')) {
    filePath = './src/pages/contact/index.html';
    console.log(`📞 Contacto: ${filePath}`);
  }
  else if (filePath === './orders' || filePath === './pedidos' || filePath.startsWith('./orders')) {
    filePath = './src/pages/user/orders.html';
    console.log(`📋 Pedidos: ${filePath}`);
  }
  else if (filePath === './wishlist' || filePath === './deseos' || filePath.startsWith('./wishlist')) {
    filePath = './src/pages/user/wishlist.html';
    console.log(`❤️ Wishlist: ${filePath}`);
  }
  else if (filePath === './contact' || filePath === './contacto' || filePath.startsWith('./contact')) {
    filePath = './src/pages/contact.html';
    console.log(`📞 Contacto: ${filePath}`);
  }
  else if (filePath === './about' || filePath === './acerca' || filePath.startsWith('./about')) {
    filePath = './src/pages/about.html';
    console.log(`ℹ️ Acerca: ${filePath}`);
  }
  else if (filePath === './test-logs' || filePath.startsWith('./test-logs')) {
    filePath = './src/pages/test-logs.html';
    console.log(`🧪 Test Logs: ${filePath}`);
  }
  else if (filePath === './admin' || filePath.startsWith('./admin') ||
           filePath === '/admin' || filePath.startsWith('/admin')) {
    if (filePath === './admin/images' || filePath.startsWith('./admin/images') ||
        filePath === '/admin/images' || filePath.startsWith('/admin/images')) {
      filePath = './src/pages/admin/images.html';
      console.log(`🖼️ Admin Images: ${filePath}`);
    } else if (filePath === './admin/products' || filePath.startsWith('./admin/products') ||
               filePath === '/admin/products' || filePath.startsWith('/admin/products')) {
      filePath = './src/pages/admin/products.html';
      console.log(`📦 Admin Products: ${filePath}`);
    } else if (filePath === './admin/categories' || filePath.startsWith('./admin/categories') ||
               filePath === '/admin/categories' || filePath.startsWith('/admin/categories')) {
      filePath = './src/pages/admin/categories.html';
      console.log(`🏷️ Admin Categories: ${filePath}`);
    } else if (filePath === './admin/users' || filePath.startsWith('./admin/users') ||
               filePath === '/admin/users' || filePath.startsWith('/admin/users')) {
      filePath = './src/pages/admin/users.html';
      console.log(`👥 Admin Users: ${filePath}`);
    } else if (filePath === './admin/orders' || filePath.startsWith('./admin/orders') ||
               filePath === '/admin/orders' || filePath.startsWith('/admin/orders')) {
      filePath = './src/pages/admin/orders.html';
      console.log(`📋 Admin Orders: ${filePath}`);
    } else if (filePath === './admin/settings' || filePath.startsWith('./admin/settings') ||
               filePath === '/admin/settings' || filePath.startsWith('/admin/settings')) {
      filePath = './src/pages/admin/settings.html';
      console.log(`⚙️ Admin Settings: ${filePath}`);
    } else {
      filePath = './src/pages/admin/dashboard.html';
      console.log(`⚙️ Admin: ${filePath}`);
    }
  }
  else if (filePath === './user/profile' || filePath.startsWith('./user/profile') || 
           filePath === '/user/profile' || filePath.startsWith('/user/profile')) {
    filePath = './src/pages/user/profile.html';
    console.log(`👤 User Profile: ${filePath}`);
  }
  else if (filePath === './user/orders' || filePath.startsWith('./user/orders') ||
           filePath === '/user/orders' || filePath.startsWith('/user/orders')) {
    filePath = './src/pages/user/orders.html';
    console.log(`📦 User Orders: ${filePath}`);
  }
  else if (filePath === './user/settings' || filePath.startsWith('./user/settings') ||
           filePath === '/user/settings' || filePath.startsWith('/user/settings')) {
    filePath = './src/pages/user/settings.html';
    console.log(`⚙️ User Settings: ${filePath}`);
  }
  // Servir imágenes del backend a través del frontend
  else if (filePath.startsWith('./uploads/')) {
    // Proxificar las imágenes del backend usando la URL configurada
    const backendUrl = config.apiBaseUrl + filePath.substring(1); // Quitar el punto inicial
    console.log(`🖼️ Proxificando imagen del backend: ${backendUrl}`);
    
    try {
      const response = await fetch(backendUrl);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        res.writeHead(200, {
          'Content-Type': response.headers.get('content-type') || 'image/jpeg',
          'Content-Length': imageBuffer.byteLength,
          'Cache-Control': 'public, max-age=3600'
        });
        res.end(Buffer.from(imageBuffer));
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Imagen no encontrada');
        return;
      }
    } catch (error) {
      console.error('Error proxificando imagen:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error interno del servidor');
      return;
    }
  }
  // Si no es una ruta conocida, intentar como archivo estático
  else if (!filePath.includes('.')) {
    filePath = './src/pages/home/index.html';
    console.log(`❓ Ruta desconocida, redirigiendo a home: ${filePath}`);
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error(`❌ Error leyendo archivo ${filePath}:`, error.message);
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>404 - Archivo no encontrado</h1>
          <p>Archivo solicitado: ${req.url}</p>
          <p>Ruta buscada: ${filePath}</p>
          <a href="/">Volver al inicio</a>
        `, 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Error del servidor: ' + error.code + ' ..\n');
      }
    } else {
      // Si es un archivo HTML, inyectar la configuración de entorno
      if (contentType === 'text/html') {
        const configScript = `
  <script>
    // Configuración inyectada desde el servidor
    window.ENV = {
      API_BASE_URL: '${config.apiBaseUrl}',
      FRONTEND_URL: '${config.frontendUrl}'
    };
  </script>`;
        
        // Inyectar antes del cierre de </head> o al inicio del <body>
        let htmlContent = content.toString();
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', configScript + '\n  </head>');
        } else if (htmlContent.includes('<body')) {
          htmlContent = htmlContent.replace('<body', configScript + '\n  <body');
        } else {
          // Si no hay head ni body, agregar al inicio
          htmlContent = configScript + '\n' + htmlContent;
        }
        
        console.log(`✅ Sirviendo archivo HTML con configuración: ${filePath}`);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(htmlContent, 'utf-8');
      } else {
        console.log(`✅ Sirviendo archivo: ${filePath}`);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    }
  });
});

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 Frontend ejecutándose en ${config.frontendUrl}`);
  console.log(`📱 Abre tu navegador en ${config.frontendUrl}`);
  console.log('⏹️  Presiona Ctrl+C para detener el servidor');
});