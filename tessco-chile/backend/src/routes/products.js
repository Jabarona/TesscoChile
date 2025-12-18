const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { uploadBuffer, buildTransformedUrl } = require('../utils/cloudinary-upload');
const { defaultFolder } = require('../config/cloudinary');

const router = express.Router();

// Configurar multer para manejar multipart/form-data
const upload = multer();

// Función para procesar imágenes en Cloudinary
async function processImages(files, productId) {
  let imageUrl = null;
  let imageThumbnail = null;
  const images = [];
  const imageThumbnails = [];
  let imageVariants = null;
  const galleryVariants = [];

  if (!files) {
    return { imageUrl, imageThumbnail, images, imageThumbnails, imageVariants, galleryVariants };
  }

  const baseFolder = (defaultFolder || 'tessco/products').replace(/\/$/, '');
  const productFolder = `${baseFolder}/${productId}`;
  const variantPresets = {
    large: [{ width: 1000, height: 1000, crop: 'fill', gravity: 'auto', quality: 'auto:best', fetch_format: 'auto' }],
    medium: [{ width: 700, height: 700, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }],
    small: [{ width: 420, height: 420, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }],
    thumbnail: [{ width: 220, height: 220, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }],
    placeholder: [{ width: 40, height: 40, crop: 'fill', gravity: 'auto', quality: 'auto:low', fetch_format: 'auto', effect: 'blur:200' }]
  };

  const buildVariantSet = (publicId, secureUrl) => {
    if (!publicId) {
      return null;
    }

    const variants = {
      original: secureUrl,
      large: buildTransformedUrl(publicId, variantPresets.large),
      medium: buildTransformedUrl(publicId, variantPresets.medium),
      small: buildTransformedUrl(publicId, variantPresets.small),
      thumbnail: buildTransformedUrl(publicId, variantPresets.thumbnail),
      placeholder: buildTransformedUrl(publicId, variantPresets.placeholder),
      webp: buildTransformedUrl(publicId, [{ ...variantPresets.large[0], fetch_format: 'webp' }])
    };

    const retinaTransform = { ...variantPresets.large[0], dpr: 2, width: variantPresets.large[0].width, height: variantPresets.large[0].height };
    variants.large2x = buildTransformedUrl(publicId, [retinaTransform]);

    return variants;
  };

  try {
    if (files.productImageFile && files.productImageFile[0]) {
      const mainImage = files.productImageFile[0];
      const timestamp = Date.now();

      const mainUpload = await uploadBuffer(mainImage.buffer, {
        folder: productFolder,
        public_id: `main-${timestamp}`
      });

      imageVariants = {
        publicId: mainUpload.public_id,
        ...buildVariantSet(mainUpload.public_id, mainUpload.secure_url)
      };

      imageUrl = imageVariants.large || mainUpload.secure_url;
      imageThumbnail = imageVariants.thumbnail;
    }

    if (files.productImagesFiles && files.productImagesFiles.length > 0) {
      for (let i = 0; i < files.productImagesFiles.length; i++) {
        const additionalImage = files.productImagesFiles[i];
        const timestamp = Date.now();
        const publicId = `additional-${i}-${timestamp}`;

        const uploaded = await uploadBuffer(additionalImage.buffer, {
          folder: productFolder,
          public_id: publicId
        });

        const variants = {
          publicId: uploaded.public_id,
          ...buildVariantSet(uploaded.public_id, uploaded.secure_url)
        };

        galleryVariants.push(variants);
        images.push(variants.large || uploaded.secure_url);
        imageThumbnails.push(variants.thumbnail);
      }
    }

    return { imageUrl, imageThumbnail, images, imageThumbnails, imageVariants, galleryVariants };
  } catch (error) {
    console.error('Error procesando imágenes en Cloudinary:', error);
    return {
      imageUrl: null,
      imageThumbnail: null,
      images: [],
      imageThumbnails: [],
      imageVariants: null,
      galleryVariants: []
    };
  }
}

function normalizeMultilineField(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\r\n/g, '\n');
  return normalized.trim().length === 0 ? null : normalized;
}

// Middleware de debug para multer
const debugMulter = (req, res, next) => {
  console.log('🔧 Multer middleware ejecutándose...');
  console.log('🔧 Content-Type:', req.headers['content-type']);
  console.log('🔧 req.body antes de multer:', req.body);
  next();
};

// Validaciones
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('categoryId')
    .isString()
    .withMessage('categoryId es requerido'),
  body('brandName')
    .isString()
    .withMessage('brandName es requerido'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Debe ser una URL válida'),
  body('images')
    .optional()
    .isArray()
    .withMessage('images debe ser un array'),
  body('features')
    .optional()
    .isString()
    .withMessage('features debe ser texto'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano')
];

// GET /api/products - Listar productos con filtros
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número entero mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un número entre 1 y 100'),
  query('category').optional().isString(),
  query('brand').optional().isString(),
  query('search').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['name', 'price', 'createdAt']),
  query('order').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const where = {
      isActive: true
    };

    if (category) {
      where.categoryId = category;
    }

    if (brand) {
      where.brandId = brand;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { features: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Ejecutar consulta
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: {
          [sort]: order
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products - Crear nuevo producto
router.post('/', debugMulter, upload.fields([
  { name: 'productImageFile', maxCount: 1 },
  { name: 'productImagesFiles', maxCount: 5 }
]), authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Después de multer:');
    console.log('🔧 req.body:', req.body);
    console.log('🔧 req.files:', req.files);
    
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { name, description, price, stock = 0, categoryId, brandName, brandId, imageUrl, images = [], isActive = 'true', features, existingImages } = req.body;
    
    // Convertir strings a tipos correctos
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      features: normalizeMultilineField(features),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      categoryId: categoryId.trim(),
      brandName: brandName.trim(),
      isActive: isActive === 'true' || isActive === true
    };
    
    console.log('🔍 Datos recibidos en el backend (después de multer):');
    console.log('🔍 categoryId:', categoryId);
    console.log('🔍 brandName:', brandName);
    console.log('🔍 req.body completo:', req.body);
    console.log('🔍 req.files:', req.files);
    
    // Validar campos requeridos
    if (!productData.name || !productData.categoryId || !productData.brandName || !productData.price) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: [
          ...(!productData.name ? [{ field: 'name', message: 'El nombre es requerido' }] : []),
          ...(!productData.categoryId ? [{ field: 'categoryId', message: 'La categoría es requerida' }] : []),
          ...(!productData.brandName ? [{ field: 'brandName', message: 'La marca es requerida' }] : []),
          ...(!productData.price ? [{ field: 'price', message: 'El precio es requerido' }] : [])
        ]
      });
    }

    // Verificar que la categoría exista
    const category = await prisma.category.findUnique({ where: { id: productData.categoryId } });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Manejar la marca: crear automáticamente si se proporciona brandName
    let brand;
    console.log('🔍 Verificando brandName:', productData.brandName);
    
    if (productData.brandName) {
      // Buscar marca existente por nombre
      brand = await prisma.brand.findFirst({ 
        where: { 
          name: { 
            equals: productData.brandName, 
            mode: 'insensitive' 
          } 
        } 
      });
      
      console.log('🔍 Marca encontrada:', brand);
      
      // Si no existe, crear nueva marca
      if (!brand) {
        const slug = productData.brandName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        console.log('🔍 Creando nueva marca con slug:', slug);
        
        brand = await prisma.brand.create({
          data: {
            name: productData.brandName,
            slug: slug,
            isActive: true
          }
        });
        
        console.log('🔍 Marca creada:', brand);
      }
    } else if (brandId) {
      // Buscar marca por ID (para compatibilidad con edición)
      brand = await prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Se debe proporcionar el nombre de la marca'
      });
    }

    // Crear el producto primero para obtener el ID
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        categoryId: productData.categoryId,
        brandId: brand.id,
        imageUrl: null, // Temporalmente null
        imageThumbnail: null,
        features: productData.features,
        images: [],
        imageThumbnails: [],
        isActive: productData.isActive
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Procesar imágenes si existen
    console.log('🔍 Procesando imágenes...');
    const imageData = await processImages(req.files, product.id);
    
    console.log('🔍 Datos de imagen procesados:', imageData);

    // Manejar imágenes existentes si se enviaron (imágenes que ya se subieron antes de guardar)
    let finalImages = imageData.images || [];
    let finalImageThumbnails = imageData.imageThumbnails || [];
    let finalGalleryVariants = imageData.galleryVariants || [];
    
    if (existingImages) {
      try {
        const parsedExistingImages = typeof existingImages === 'string' 
          ? JSON.parse(existingImages) 
          : existingImages;
        
        const existingImagesArray = Array.isArray(parsedExistingImages) ? parsedExistingImages : [parsedExistingImages];
        
        console.log('📸 Imágenes existentes recibidas al crear producto:', existingImagesArray.length);
        
        // Normalizar las imágenes existentes a strings
        const normalizedExisting = existingImagesArray.map(img => {
          if (typeof img === 'string') return img;
          if (img && typeof img === 'object') {
            return img.original || img.large || img.medium || img.url || Object.values(img)[0] || String(img);
          }
          return String(img);
        }).filter(url => url && url !== '');
        
        // Combinar imágenes existentes con las nuevas (evitar duplicados)
        const newImagesToAdd = imageData.images.filter(newImg => {
          const newImgUrl = typeof newImg === 'string' ? newImg : (newImg.large || newImg.original || newImg);
          return !normalizedExisting.some(existingImg => {
            const existingImgUrl = typeof existingImg === 'string' ? existingImg : (existingImg.large || existingImg.original || existingImg);
            return existingImgUrl === newImgUrl;
          });
        });
        
        finalImages = [...normalizedExisting, ...newImagesToAdd];
        finalImageThumbnails = [...normalizedExisting.map(() => null), ...imageData.imageThumbnails.filter((_, idx) => {
          const newImg = imageData.images[idx];
          const newImgUrl = typeof newImg === 'string' ? newImg : (newImg.large || newImg.original || newImg);
          return newImagesToAdd.some(img => {
            const imgUrl = typeof img === 'string' ? img : (img.large || img.original || img);
            return imgUrl === newImgUrl;
          });
        })];
        finalGalleryVariants = imageData.galleryVariants; // Solo las nuevas tienen variants
        
        console.log('📸 Imágenes finales combinadas al crear:', {
          existentes: normalizedExisting.length,
          nuevas: newImagesToAdd.length,
          total: finalImages.length
        });
      } catch (e) {
        console.error('Error parseando existingImages al crear producto:', e);
        // Continuar con solo las imágenes procesadas
      }
    }

    // Normalizar todas las imágenes a strings
    const normalizedFinalImages = finalImages.map(img => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object') {
        return img.large || img.original || img.medium || img.small || Object.values(img)[0] || String(img);
      }
      return String(img);
    }).filter(img => img && img !== '');

    // Actualizar el producto con las URLs de las imágenes
    if (imageData.imageUrl || normalizedFinalImages.length > 0 || imageData.imageVariants) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: imageData.imageUrl,
          imageThumbnail: imageData.imageThumbnail,
          features: productData.features,
          images: normalizedFinalImages,
          imageThumbnails: finalImageThumbnails.filter(t => t != null && t !== ''),
          imageVariants: imageData.imageVariants,
          galleryVariants: finalGalleryVariants.length > 0 ? finalGalleryVariants : null
        }
      });
      
      console.log('📸 Producto actualizado con imágenes:', {
        total: normalizedFinalImages.length,
        thumbnails: finalImageThumbnails.length,
        variants: finalGalleryVariants.length
      });
    }

    // Obtener el producto actualizado con las imágenes
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', upload.fields([
  { name: 'productImageFile', maxCount: 1 },
  { name: 'productImagesFiles', maxCount: 5 }
]), authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Después de multer (PUT):');
    console.log('🔧 req.body:', req.body);
    console.log('🔧 req.files:', req.files);
    
    const { name, description, price, stock = 0, categoryId, brandName, brandId, imageUrl, images = [], isActive = 'true', features, existingImages } = req.body;
    
    // Convertir strings a tipos correctos
    const productData = {
      name: name ? name.trim() : null,
      description: description ? description.trim() : null,
      features: normalizeMultilineField(features),
      price: price ? parseFloat(price) : null,
      stock: stock ? parseInt(stock) : null,
      categoryId: categoryId ? categoryId.trim() : null,
      brandName: brandName ? brandName.trim() : null,
      isActive: isActive === 'true' || isActive === true
    };
    
    // Validar campos requeridos
    if (!productData.name || !productData.categoryId || !productData.brandName || !productData.price) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: [
          ...(!productData.name ? [{ field: 'name', message: 'El nombre es requerido' }] : []),
          ...(!productData.categoryId ? [{ field: 'categoryId', message: 'La categoría es requerida' }] : []),
          ...(!productData.brandName ? [{ field: 'brandName', message: 'La marca es requerida' }] : []),
          ...(!productData.price ? [{ field: 'price', message: 'El precio es requerido' }] : [])
        ]
      });
    }

    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;

    // Verificar si el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que la categoría exista si se proporciona
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }

    // Manejar la marca: crear automáticamente si se proporciona brandName
    let brand;
    console.log('🔍 Verificando brandName (PUT):', productData.brandName);
    
    if (productData.brandName) {
      // Buscar marca existente por nombre
      brand = await prisma.brand.findFirst({ 
        where: { 
          name: { 
            equals: productData.brandName, 
            mode: 'insensitive' 
          } 
        } 
      });
      
      console.log('🔍 Marca encontrada (PUT):', brand);
      
      // Si no existe, crear nueva marca
      if (!brand) {
        const slug = productData.brandName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        console.log('🔍 Creando nueva marca con slug (PUT):', slug);
        
        brand = await prisma.brand.create({
          data: {
            name: productData.brandName,
            slug: slug,
            isActive: true
          }
        });
      }
    } else if (brandId) {
      // Buscar marca por ID (para compatibilidad)
      brand = await prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }
    }

    const updateData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      categoryId: productData.categoryId,
      brandId: brand.id, // Usar el ID de la marca encontrada o creada
      isActive: productData.isActive
    };

    if (typeof features !== 'undefined') {
      updateData.features = productData.features;
    }
    
    console.log('🔍 Actualizando producto con datos:', updateData);

    // Procesar imágenes si existen
    console.log('🔍 Procesando imágenes (PUT)...');
    const imageData = await processImages(req.files, id);
    
    console.log('🔍 Datos de imagen procesados (PUT):', imageData);

    // Obtener imágenes existentes del producto
    // Si se enviaron explícitamente desde el frontend, usarlas (ya incluyen las eliminadas)
    // Si no, usar las del producto actual
    let existingImagesArray = [];
    let existingThumbnailsArray = [];
    let existingGalleryVariantsArray = [];
    
    if (existingImages) {
      try {
        // FormData envía strings, necesitamos parsear el JSON
        const parsedImages = typeof existingImages === 'string' 
          ? JSON.parse(existingImages) 
          : existingImages;
        
        // Asegurarse de que es un array
        existingImagesArray = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
        
        console.log('📸 Imágenes recibidas desde frontend:', existingImagesArray.length);
        console.log('📸 URLs de imágenes recibidas:', existingImagesArray);
        console.log('📸 Imágenes nuevas procesadas desde archivos:', imageData.images.length);
        
        // Obtener imágenes del producto actual
        const existingProductImages = existingProduct.images || [];
        const existingProductThumbnails = existingProduct.imageThumbnails || [];
        const existingProductGalleryVariants = existingProduct.galleryVariants || [];
        
        // Separar imágenes en dos grupos:
        // 1. Imágenes que ya están en el producto (tienen thumbnails/variants)
        // 2. Imágenes nuevas que se subieron en esta sesión (solo tienen URL)
        existingImagesArray.forEach((imgUrl, index) => {
          const imgUrlString = typeof imgUrl === 'string' ? imgUrl : (imgUrl.large || imgUrl.original || imgUrl);
          
          // Buscar si esta imagen ya está en el producto
          const productIndex = existingProductImages.findIndex(pImg => {
            const pImgUrl = typeof pImg === 'string' ? pImg : (pImg.large || pImg.original || pImg);
            return pImgUrl === imgUrlString;
          });
          
          if (productIndex >= 0) {
            // Imagen existente: usar thumbnails y variants del producto
            existingImagesArray[index] = existingProductImages[productIndex];
            if (productIndex < existingProductThumbnails.length) {
              existingThumbnailsArray.push(existingProductThumbnails[productIndex]);
            }
            if (productIndex < existingProductGalleryVariants.length) {
              existingGalleryVariantsArray.push(existingProductGalleryVariants[productIndex]);
            }
          } else {
            // Imagen nueva: buscar en las imágenes procesadas recientemente
            const newImageIndex = imageData.images.findIndex(newImg => {
              const newImgUrl = typeof newImg === 'string' ? newImg : (newImg.large || newImg.original || newImg);
              return newImgUrl === imgUrlString;
            });
            
            if (newImageIndex >= 0) {
              // Usar la imagen procesada con sus variants
              existingImagesArray[index] = imageData.images[newImageIndex];
              if (newImageIndex < imageData.imageThumbnails.length) {
                existingThumbnailsArray.push(imageData.imageThumbnails[newImageIndex]);
              }
              if (newImageIndex < imageData.galleryVariants.length) {
                existingGalleryVariantsArray.push(imageData.galleryVariants[newImageIndex]);
              }
            } else {
              // Imagen nueva que no está en imageData (se subió antes pero no se procesó ahora)
              // Mantener solo la URL
              existingImagesArray[index] = imgUrlString;
              // No agregar thumbnail/variant (se perderán, pero es mejor que perder la imagen)
            }
          }
        });
      } catch (e) {
        console.error('Error parseando existingImages:', e);
        existingImagesArray = existingProduct.images || [];
        existingThumbnailsArray = existingProduct.imageThumbnails || [];
        existingGalleryVariantsArray = existingProduct.galleryVariants || [];
      }
    } else {
      // Si no se enviaron, usar todas las imágenes actuales del producto
      existingImagesArray = existingProduct.images || [];
      existingThumbnailsArray = existingProduct.imageThumbnails || [];
      existingGalleryVariantsArray = existingProduct.galleryVariants || [];
    }

    // Combinar imágenes existentes con las nuevas (evitar duplicados)
    // Las imágenes nuevas que ya están en existingImagesArray no deben duplicarse
    const newImagesToAdd = imageData.images.filter(newImg => {
      const newImgUrl = typeof newImg === 'string' ? newImg : (newImg.large || newImg.original || newImg);
      return !existingImagesArray.some(existingImg => {
        const existingImgUrl = typeof existingImg === 'string' ? existingImg : (existingImg.large || existingImg.original || existingImg);
        return existingImgUrl === newImgUrl;
      });
    });
    
    // Combinar: primero las existentes, luego las nuevas que no están duplicadas
    const combinedImages = [...existingImagesArray, ...newImagesToAdd];
    
    console.log('📸 Combinando imágenes:', {
      existentes: existingImagesArray.length,
      nuevasDesdeArchivos: newImagesToAdd.length,
      totalCombinadas: combinedImages.length
    });
    const combinedImageThumbnails = [...existingThumbnailsArray, ...imageData.imageThumbnails.filter((_, idx) => {
      const newImg = imageData.images[idx];
      const newImgUrl = typeof newImg === 'string' ? newImg : (newImg.large || newImg.original || newImg);
      return newImagesToAdd.some(img => {
        const imgUrl = typeof img === 'string' ? img : (img.large || img.original || img);
        return imgUrl === newImgUrl;
      });
    })];
    const combinedGalleryVariants = [...existingGalleryVariantsArray, ...imageData.galleryVariants.filter((_, idx) => {
      const newImg = imageData.images[idx];
      const newImgUrl = typeof newImg === 'string' ? newImg : (newImg.large || newImg.original || newImg);
      return newImagesToAdd.some(img => {
        const imgUrl = typeof img === 'string' ? img : (img.large || img.original || img);
        return imgUrl === newImgUrl;
      });
    })];
    
    console.log('📸 Imágenes finales combinadas:', combinedImages.length);

    // Agregar datos de imagen al updateData
    if (imageData.imageUrl || imageData.imageVariants) {
      // Solo actualizar imagen principal si se subió una nueva
      updateData.imageUrl = imageData.imageUrl || existingProduct.imageUrl;
      updateData.imageThumbnail = imageData.imageThumbnail || existingProduct.imageThumbnail;
      updateData.imageVariants = imageData.imageVariants || existingProduct.imageVariants;
    }
    
    // Normalizar las imágenes a strings para guardarlas en la base de datos
    // Prisma espera un array de strings para el campo images
    const normalizedImages = combinedImages.map(img => {
      if (typeof img === 'string') {
        return img;
      } else if (img && typeof img === 'object') {
        // Si es un objeto, extraer la URL (preferir large, luego original, luego el primer valor)
        return img.large || img.original || img.medium || img.small || Object.values(img)[0] || String(img);
      }
      return String(img);
    });
    
    // Normalizar thumbnails
    const normalizedThumbnails = combinedImageThumbnails.map((thumb, idx) => {
      if (thumb) {
        return typeof thumb === 'string' ? thumb : String(thumb);
      }
      // Si no hay thumbnail, intentar generar uno desde la imagen
      const img = combinedImages[idx];
      if (img && typeof img === 'object' && img.thumbnail) {
        return img.thumbnail;
      }
      return null;
    });
    
    // Asegurarse de que los arrays tengan la misma longitud
    while (normalizedThumbnails.length < normalizedImages.length) {
      normalizedThumbnails.push(null);
    }
    
    // Actualizar imágenes adicionales (combinadas)
    // Siempre actualizar si hay imágenes (existentes o nuevas)
    // Usar combinedImages si tiene contenido, sino usar existingImagesArray
    let finalImagesArray = [];
    let finalThumbnailsArray = [];
    let finalGalleryVariants = [];
    
    if (normalizedImages.length > 0) {
      // Usar las imágenes combinadas y normalizadas
      finalImagesArray = normalizedImages;
      finalThumbnailsArray = normalizedThumbnails;
      finalGalleryVariants = combinedGalleryVariants;
    } else if (existingImagesArray.length > 0) {
      // Si no hay imágenes combinadas pero hay existentes, usar las existentes
      finalImagesArray = existingImagesArray.map(img => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object') {
          return img.large || img.original || img.medium || img.small || Object.values(img)[0] || String(img);
        }
        return String(img);
      });
      finalThumbnailsArray = existingThumbnailsArray.length > 0 
        ? existingThumbnailsArray.map(t => typeof t === 'string' ? t : (t ? String(t) : null))
        : finalImagesArray.map(() => null);
      finalGalleryVariants = existingGalleryVariantsArray;
    }
    
    // Siempre actualizar las imágenes si hay alguna
    if (finalImagesArray.length > 0) {
      // Filtrar valores null/undefined de los arrays
      updateData.images = finalImagesArray.filter(img => img != null && img !== '');
      updateData.imageThumbnails = finalThumbnailsArray.filter(thumb => thumb != null && thumb !== '');
      
      // Asegurarse de que galleryVariants sea un array válido o null
      if (finalGalleryVariants && Array.isArray(finalGalleryVariants) && finalGalleryVariants.length > 0) {
        // Filtrar valores null/undefined y asegurar que todos sean objetos válidos
        const validVariants = finalGalleryVariants.filter(v => v != null && typeof v === 'object');
        updateData.galleryVariants = validVariants.length > 0 ? validVariants : null;
      } else {
        updateData.galleryVariants = null;
      }
      
      console.log('📸 Guardando imágenes finales en base de datos:', {
        total: updateData.images.length,
        thumbnails: updateData.imageThumbnails.length,
        variants: updateData.galleryVariants ? updateData.galleryVariants.length : 0,
        images: updateData.images
      });
    } else {
      console.log('⚠️ No hay imágenes para guardar');
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Verificar que las imágenes se guardaron correctamente
    console.log('📸 Producto actualizado - Imágenes guardadas:', {
      total: product.images?.length || 0,
      images: product.images
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    });

  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ UpdateData que causó el error:', JSON.stringify(updateData, null, 2));
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;

    // Verificar si el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          select: {
            id: true
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si tiene órdenes asociadas
    if (existingProduct.orderItems.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar un producto que tiene órdenes asociadas'
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
