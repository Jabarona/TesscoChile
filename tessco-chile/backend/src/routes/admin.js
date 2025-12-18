const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { prisma } = require('../config/database');

const router = express.Router();

// Proteger todas las rutas siguientes con autenticación y rol admin
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Resumen para el dashboard
router.get('/stats', async (req, res) => {
  try {
    const [usersCount, productsCount, salesAggregate, pendingOrdersCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      // IMPORTANTE: Solo contar ingresos de órdenes con pago confirmado/aprobado
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid'  // Solo órdenes pagadas
        },
        _sum: { total: true }
      }),
      prisma.order.count({
        where: { status: 'pending' }
      })
    ]);

    res.json({
      totalUsers: usersCount,
      totalProducts: productsCount,
      totalSales: salesAggregate._sum.total || 0,  // Solo ingresos de pagos confirmados
      pendingOrders: pendingOrdersCount
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas del dashboard'
    });
  }
});

// GET /api/admin/orders/recent - Últimas órdenes para el dashboard
router.get('/orders/recent', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error obteniendo órdenes recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes recientes'
    });
  }
});

module.exports = router;

