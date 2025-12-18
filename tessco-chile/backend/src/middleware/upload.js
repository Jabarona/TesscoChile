const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const createDirectories = () => {
  const dirs = [
    'public/uploads/products',
    'public/uploads/banners',
    'public/uploads/categories',
    'public/uploads/brands',
    'public/uploads/users',
    'public/uploads/logo'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Configuración de multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Verificar tipo de archivo
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

// Función para procesar y guardar imagen
const processImage = async (file, folder, filename) => {
  try {
    createDirectories();
    
    const uploadPath = path.join('public', 'uploads', folder);
    const fullPath = path.join(uploadPath, filename);
    
    // Procesar imagen con Sharp
    await sharp(file.buffer)
      .resize(800, 600, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toFile(fullPath);
    
    // Crear thumbnail
    const thumbnailPath = path.join(uploadPath, 'thumb_' + filename);
    await sharp(file.buffer)
      .resize(200, 200, { 
        fit: 'cover' 
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return {
      original: `/uploads/${folder}/${filename}`,
      thumbnail: `/uploads/${folder}/thumb_${filename}`
    };
  } catch (error) {
    throw new Error(`Error procesando imagen: ${error.message}`);
  }
};

// Middleware para subir una imagen
const uploadSingle = (folder) => {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen'
        });
      }

      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const result = await processImage(req.file, folder, filename);
      
      req.uploadedImage = result;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Middleware para subir múltiples imágenes
const uploadMultiple = (folder, maxCount = 5) => {
  return async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron imágenes'
        });
      }

      if (req.files.length > maxCount) {
        return res.status(400).json({
          success: false,
          message: `Máximo ${maxCount} imágenes permitidas`
        });
      }

      const results = [];
      for (let i = 0; i < req.files.length; i++) {
        const filename = `${Date.now()}-${i}-${Math.round(Math.random() * 1E9)}.jpg`;
        const result = await processImage(req.files[i], folder, filename);
        results.push(result);
      }
      
      req.uploadedImages = results;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Función específica para logo
const uploadLogo = (req, res, next) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        createDirectories();
        cb(null, 'public/uploads/logo');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `logo-${uniqueSuffix}.jpg`);
      }
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB para logo
    }
  });

  upload.single('logo')(req, res, next);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  processImage,
  uploadLogo
};
