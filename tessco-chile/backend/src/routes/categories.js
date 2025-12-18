const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

async function hasCircularReference(categoryId, parentId) {
  if (!parentId || parentId === categoryId) {
    return parentId === categoryId;
  }

  let currentParentId = parentId;

  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true;
    }

    const parentCategory = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    });

    if (!parentCategory) {
      break;
    }

    currentParentId = parentCategory.parentId;
  }

  return false;
}

function normalizeParentId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    return trimmed;
  }

  return value;
}

// Validaciones
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('slug')
    .trim()
    .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .withMessage('El slug solo puede contener letras minúsculas, números y guiones, y no puede empezar o terminar con guión'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (value && value.trim() !== '') {
        // Validar que sea una URL válida (absoluta o relativa)
        const urlPattern = /^(https?:\/\/.+|\/uploads\/.+)$/;
        if (!urlPattern.test(value)) {
          throw new Error('Debe ser una URL válida (absoluta o relativa)');
        }
      }
      return true;
    }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano'),
  body('parentId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      if (typeof value !== 'string') {
        throw new Error('parentId debe ser un identificador válido');
      }

      if (value.trim() === '') {
        return true;
      }

      return true;
    })
];

// GET /api/categories - Listar todas las categorías
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        products: {
          select: {
            id: true
          }
        },
        children: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/categories/:id - Obtener categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        products: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            createdAt: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/categories - Crear nueva categoría
router.post('/', authenticateToken, categoryValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación en categoría:', errors.array());
      console.log('📝 Datos recibidos:', req.body);
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

    const { name, slug, description, imageUrl, isActive = true } = req.body;
    let parentId = normalizeParentId(req.body.parentId);

    // Verificar si ya existe una categoría con ese nombre o slug
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre o slug'
      });
    }

    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true }
      });

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'La categoría padre seleccionada no existe'
        });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive,
        parentId: parentId || null
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        products: {
          select: {
            id: true
          }
        },
        children: {
          select: {
            id: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: category
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', authenticateToken, categoryValidation, async (req, res) => {
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
    const { name, slug, description, imageUrl, isActive } = req.body;
    const submittedParentId = req.body.hasOwnProperty('parentId') ? req.body.parentId : undefined;
    const parentId = submittedParentId !== undefined ? normalizeParentId(submittedParentId) : undefined;

    // Verificar si la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si ya existe otra categoría con ese nombre o slug
    const duplicateCategory = await prisma.category.findFirst({
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

    if (duplicateCategory) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra categoría con ese nombre o slug'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (parentId !== undefined) {
      if (parentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Una categoría no puede ser su propia categoría padre'
        });
      }

      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
          select: { id: true }
        });

        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'La categoría padre seleccionada no existe'
          });
        }

        const circular = await hasCircularReference(id, parentId);
        if (circular) {
          return res.status(400).json({
            success: false,
            message: 'La categoría padre seleccionada genera una referencia circular'
          });
        }
      }

      updateData.parentId = parentId || null;
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        products: {
          select: {
            id: true
          }
        },
        children: {
          select: {
            id: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: category
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/categories/:id - Eliminar categoría
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

    // Verificar si la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true
          }
        },
        children: {
          select: {
            id: true
          }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si tiene productos asociados
    if (existingCategory.products.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar una categoría que tiene productos asociados'
      });
    }

  // Verificar si tiene subcategorías asociadas
  if (existingCategory.children.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'No se puede eliminar una categoría que tiene subcategorías asociadas'
    });
  }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
