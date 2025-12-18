// Configuración de la aplicación frontend
// Las URLs se pueden configurar mediante variables de entorno o usar valores por defecto
const getEnvVar = (name, defaultValue) => {
  // En el navegador, las variables de entorno no están disponibles directamente
  // Se pueden inyectar durante el build o usar window.ENV
  if (typeof window !== 'undefined' && window.ENV && window.ENV[name]) {
    return window.ENV[name];
  }
  return defaultValue;
};

const config = {
  // URLs de la API - se pueden configurar con variables de entorno
  apiBaseUrl: getEnvVar('API_BASE_URL', 'http://localhost:4000'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
  
  // Endpoints de la API
  endpoints: {
    auth: '/api/auth',
    upload: '/api/upload',
    products: '/api/products',
    categories: '/api/categories',
    orders: '/api/orders',
    users: '/api/users',
    payments: '/api/payments'
  },
  
  // Configuración de upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    folders: {
      products: 'products',
      banners: 'banners',
      categories: 'categories',
      brands: 'brands',
      users: 'users'
    }
  },
  
  // Configuración de la aplicación
  app: {
    name: 'Tessco Chile',
    version: '1.0.0',
    description: 'Tu tienda de tecnología y accesorios'
  }
};

// Función para obtener la URL completa de un endpoint
config.getApiUrl = (endpoint) => {
  return `${config.apiBaseUrl}${endpoint}`;
};

// Función para obtener la URL de una imagen
config.getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Si la imagen está en /uploads, servirla desde el backend
  if (imagePath.startsWith('/uploads')) {
    return `${config.apiBaseUrl}${imagePath}`;
  }
  // Para otros recursos estáticos usa el dominio del frontend
  return `${config.frontendUrl}${imagePath}`;
};

// Función para obtener la URL de upload
config.getUploadUrl = (folder) => {
  return `${config.apiBaseUrl}${config.endpoints.upload}/${folder}`;
};

// Exportar para uso en el navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.config = config;
}