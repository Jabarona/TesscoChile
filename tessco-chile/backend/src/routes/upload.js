const express = require('express');
const { upload, uploadSingle, uploadMultiple, uploadLogo } = require('../middleware/upload');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const router = express.Router();

// POST /api/upload/product - Subir imagen de producto
router.post('/product', [
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  uploadSingle('products')
], async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Imagen de producto subida exitosamente',
      data: {
        image: req.uploadedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subiendo imagen de producto'
    });
  }
});

// POST /api/upload/products - Subir múltiples imágenes de producto
router.post('/products', [
  authenticateToken,
  requireAdmin,
  upload.array('images', 5),
  uploadMultiple('products', 5)
], async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Imágenes de productos subidas exitosamente',
      data: {
        images: req.uploadedImages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subiendo imágenes de productos'
    });
  }
});

// POST /api/upload/banner - Subir banner
router.post('/banner', [
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  uploadSingle('banners')
], async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Banner subido exitosamente',
      data: {
        image: req.uploadedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subiendo banner'
    });
  }
});

// POST /api/upload/category - Subir imagen de categoría
router.post('/category', [
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  uploadSingle('categories')
], async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Imagen de categoría subida exitosamente',
      data: {
        image: req.uploadedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subiendo imagen de categoría'
    });
  }
});

// POST /api/upload/brand - Subir logo de marca
router.post('/brand', [
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  uploadSingle('brands')
], async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logo de marca subido exitosamente',
      data: {
        image: req.uploadedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subiendo logo de marca'
    });
  }
});

// POST /api/upload/avatar - Subir avatar de usuario
router.post('/avatar', [
  authenticateToken,
  upload.single('image'),
  uploadSingle('users')
], async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Avatar subido exitosamente',
      data: {
        image: req.uploadedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subiendo avatar'
    });
  }
});

// DELETE /api/upload/:folder/:filename - Eliminar imagen
router.delete('/:folder/:filename', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const validFolders = ['products', 'banners', 'categories', 'brands', 'users'];
    
    if (!validFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Carpeta no válida'
      });
    }

    const imagePath = path.join('public', 'uploads', folder, filename);
    const thumbPath = path.join('public', 'uploads', folder, 'thumb_' + filename);

    // Eliminar archivo original
    if (fsSync.existsSync(imagePath)) {
      fsSync.unlinkSync(imagePath);
    }

    // Eliminar thumbnail
    if (fsSync.existsSync(thumbPath)) {
      fsSync.unlinkSync(thumbPath);
    }

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error eliminando imagen'
    });
  }
});

// GET /api/upload/list/:folder - Listar imágenes de una carpeta
router.get('/list/:folder', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const { folder } = req.params;
    const validFolders = ['products', 'banners', 'categories', 'brands', 'users'];
    
    if (!validFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Carpeta no válida'
      });
    }

    const folderPath = path.join('public', 'uploads', folder);
    
    if (!fsSync.existsSync(folderPath)) {
      return res.json({
        success: true,
        data: {
          images: []
        }
      });
    }

    const files = fsSync.readdirSync(folderPath)
      .filter(file => file.endsWith('.jpg') && !file.startsWith('thumb_'))
      .map(file => ({
        filename: file,
        original: `/uploads/${folder}/${file}`,
        thumbnail: `/uploads/${folder}/thumb_${file}`,
        size: fsSync.statSync(path.join(folderPath, file)).size,
        created: fsSync.statSync(path.join(folderPath, file)).birthtime
      }))
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      data: {
        images: files
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error listando imágenes'
    });
  }
});

// ==================== RUTAS DEL LOGO ====================

// POST /api/upload/logo - Subir logo de la empresa
router.post('/logo', [
  authenticateToken,
  requireAdmin,
  uploadLogo,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó archivo de logo'
        });
      }

      const logoPath = `/uploads/logo/${req.file.filename}`;
      
      // Guardar la ruta del logo en un archivo de configuración
      const configPath = path.join(__dirname, '../../config/logo.json');
      await fs.writeFile(configPath, JSON.stringify({ logo: logoPath }));

      res.json({
        success: true,
        message: 'Logo actualizado exitosamente',
        data: {
          logo: logoPath
        }
      });
    } catch (error) {
      console.error('Error subiendo logo:', error);
      res.status(500).json({
        success: false,
        message: 'Error subiendo logo'
      });
    }
  }
]);

// GET /api/upload/logo - Obtener logo actual
router.get('/logo', [
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const configPath = path.join(__dirname, '../../config/logo.json');
      
      try {
        const logoConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
        res.json({
          success: true,
          data: {
            logo: logoConfig.logo
          }
        });
      } catch (error) {
        // Si no existe el archivo de configuración, no hay logo
        res.json({
          success: true,
          data: {
            logo: null
          }
        });
      }
    } catch (error) {
      console.error('Error obteniendo logo:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo logo'
      });
    }
  }
]);

// DELETE /api/upload/logo - Eliminar logo
router.delete('/logo', [
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const configPath = path.join(__dirname, '../../config/logo.json');
      
      try {
        const logoConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        // Eliminar archivo de logo
        if (logoConfig.logo) {
          const logoFilePath = path.join(__dirname, '../../public', logoConfig.logo);
          try {
            await fs.unlink(logoFilePath);
          } catch (error) {
            console.log('Logo file not found, continuing...');
          }
        }
        
        // Eliminar archivo de configuración
        await fs.unlink(configPath);
        
        res.json({
          success: true,
          message: 'Logo eliminado exitosamente'
        });
      } catch (error) {
        // Si no existe el archivo de configuración, el logo ya no existe
        res.json({
          success: true,
          message: 'Logo eliminado exitosamente'
        });
      }
    } catch (error) {
      console.error('Error eliminando logo:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando logo'
      });
    }
  }
]);

module.exports = router;
