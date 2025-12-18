const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

function normalizeFavorite(favorite) {
  if (!favorite) return null;

  return {
    id: favorite.id,
    productId: favorite.productId,
    createdAt: favorite.createdAt,
    product: favorite.product,
  };
}

// Obtener todos los favoritos del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: favorites.map(normalizeFavorite) });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Error al obtener los favoritos' });
  }
});

// Agregar un producto a favoritos
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'El campo productId es requerido' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      create: {
        userId: req.user.id,
        productId,
      },
      update: {},
      include: {
        product: true,
      },
    });

    res.status(201).json({ data: normalizeFavorite(favorite) });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Error al agregar el favorito' });
  }
});

// Eliminar un producto de favoritos
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    console.error('Error deleting favorite:', error);
    res.status(500).json({ error: 'Error al eliminar el favorito' });
  }
});

// Eliminar todos los favoritos del usuario
router.delete('/', async (req, res) => {
  try {
    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing favorites:', error);
    res.status(500).json({ error: 'Error al limpiar los favoritos' });
  }
});

module.exports = router;

