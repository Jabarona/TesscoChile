const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const brandValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('slug')
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('El slug solo puede contener letras minúsculas, números y guiones'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Debe ser una URL válida'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano')
];

// GET /api/brands - Listar todas las marcas
router.get('/', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        products: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/brands/:id - Obtener marca por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: true
      }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Error obteniendo marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/brands - Crear nueva marca
router.post('/', authenticateToken, brandValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { name, slug, logoUrl, isActive = true } = req.body;

    // Verificar si ya existe una marca con ese nombre o slug
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una marca con ese nombre o slug'
      });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logoUrl: logoUrl || null,
        isActive
      },
      include: {
        products: {
          select: {
            id: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Marca creada exitosamente',
      data: brand
    });

  } catch (error) {
    console.error('Error creando marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/brands/:id - Actualizar marca
router.put('/:id', authenticateToken, brandValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
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
    const { name, slug, logoUrl, isActive } = req.body;

    // Verificar si la marca existe
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    // Verificar si ya existe otra marca con ese nombre o slug
    const duplicateBrand = await prisma.brand.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { name: name },
              { slug: slug }
            ]
          }
        ]
      }
    });

    if (duplicateBrand) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra marca con ese nombre o slug'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          select: {
            id: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Marca actualizada exitosamente',
      data: brand
    });

  } catch (error) {
    console.error('Error actualizando marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/brands/:id - Eliminar marca
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

    // Verificar si la marca existe
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true
          }
        }
      }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    // Verificar si tiene productos asociados
    if (existingBrand.products.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar una marca que tiene productos asociados'
      });
    }

    await prisma.brand.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Marca eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
