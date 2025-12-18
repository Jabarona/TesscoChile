const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Verificando token:', token ? 'Presente' : 'Ausente');
    console.log('🔐 Ruta:', req.path);
    console.log('🔐 Content-Type:', req.headers['content-type']);
    console.log('🔐 req.body antes de verificación:', req.body);

    if (!token) {
      console.log('❌ No hay token en la petición');
      return res.status(401).json({ 
        success: false,
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido, userId:', decoded.userId);
    
    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado en BD para userId:', decoded.userId);
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    console.log('✅ Usuario autenticado:', user.email);
    // Agregar usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Error en autenticación:', error.name, error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expirado' 
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware para verificar rol específico
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no autenticado' 
      });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Acceso denegado. Permisos insuficientes.' 
      });
    }

    next();
  };
};

// Middleware para verificar si el usuario es admin
const requireAdmin = requireRole('admin');

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true
        }
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En caso de error, continuar sin usuario autenticado
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  optionalAuth
};
