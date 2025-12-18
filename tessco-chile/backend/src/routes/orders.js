const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// Función para encontrar o crear un usuario guest por email
async function findOrCreateGuestUser(email, customerData = {}) {
  try {
    // Buscar si existe un usuario con este email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Crear usuario guest (sin contraseña, se puede registrar después)
      // Generar una contraseña temporal aleatoria
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword, // Contraseña temporal, el usuario deberá hacer reset si quiere iniciar sesión
          firstName: customerData.firstName || null,
          lastName: customerData.lastName || null,
          phone: customerData.phone || null,
          rut: customerData.rut || null,
          role: 'user',
          isVerified: false
        }
      });

      console.log(`✅ Usuario guest creado: ${email}`);
    } else {
      // Actualizar datos del usuario si se proporcionan nuevos
      if (customerData.firstName || customerData.lastName || customerData.phone || customerData.rut) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(customerData.firstName && { firstName: customerData.firstName }),
            ...(customerData.lastName && { lastName: customerData.lastName }),
            ...(customerData.phone && { phone: customerData.phone }),
            ...(customerData.rut && { rut: customerData.rut })
          }
        });
      }

      console.log(`✅ Usuario existente encontrado: ${email}`);
    }

    return user;
  } catch (error) {
    console.error('❌ Error en findOrCreateGuestUser:', error);
    throw error;
  }
}

// GET /api/orders - Obtener órdenes del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

// GET /api/orders/:id - Obtener una orden específica (permite sin autenticación para verificar estado)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Si el usuario está autenticado, verificar que la orden le pertenece
    // Si no está autenticado, solo obtener la orden por ID (permitir verificación de estado para usuarios guest)
    const orderWhere = req.user
      ? { id: req.params.id, userId: req.user.id }
      : { id: req.params.id };

    const order = await prisma.order.findFirst({
      where: orderWhere,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// POST /api/orders - Crear una nueva orden (permite compras sin autenticación)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      items,
      customer,
      delivery,
      shipping: legacyShipping,
      payment,
      notes
    } = req.body;

    // Validar datos requeridos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items de la orden son requeridos' });
    }

    if (!customer || !customer.firstName || !customer.lastName || !customer.email) {
      return res.status(400).json({ error: 'Información del cliente es requerida' });
    }

    // Si el usuario no está autenticado, encontrar o crear usuario guest por email
    let user = req.user;
    if (!user) {
      try {
        user = await findOrCreateGuestUser(customer.email, {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          rut: customer.rut
        });
      } catch (userError) {
        console.error('❌ Error creando/buscando usuario guest:', userError);
        return res.status(500).json({ error: 'Error al procesar la información del cliente' });
      }
    }

    // Normalizar items para soportar distintos formatos
    const normalizedItems = items.map(item => ({
      productId: item.productId || item.id,
      quantity: item.quantity || 1
    }));

    if (normalizedItems.some(item => !item.productId)) {
      return res.status(400).json({ error: 'Cada item debe contener el ID del producto' });
    }

    // Verificar que los productos existan y tengan stock
    const productIds = normalizedItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Algunos productos no están disponibles' });
    }

    // Verificar stock y calcular totales
    let subtotal = 0;
    const orderItems = [];

    for (const item of normalizedItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para el producto: ${product?.name || 'Producto no encontrado'}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    // Determinar método de entrega
    const deliveryMethod = (delivery?.method || legacyShipping?.method || 'pickup').toLowerCase();
    const addressPayload = delivery?.address || legacyShipping?.address || legacyShipping || {};

    // Calcular costos de envío
    const FREE_SHIPPING_THRESHOLD = 50000;
    let shippingCost = 0;
    if (deliveryMethod !== 'pickup') {
      if (!addressPayload || !addressPayload.region || !addressPayload.street || !addressPayload.streetNumber || !(addressPayload.comuna || addressPayload.city)) {
        return res.status(400).json({ error: 'Dirección de envío incompleta' });
      }

      const providedShippingCost = delivery?.cost ?? legacyShipping?.cost;
      shippingCost = typeof providedShippingCost === 'number'
        ? providedShippingCost
        : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5000);
    }

    const total = subtotal + shippingCost;

    // Construir dirección de envío
    const shippingAddress = {
      method: deliveryMethod,
      cost: shippingCost,
      contact: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || null,
        rut: customer.rut || null
      },
      address: deliveryMethod === 'pickup' ? null : {
        region: addressPayload.region || null,
        comuna: addressPayload.comuna || addressPayload.city || null,
        street: addressPayload.street || addressPayload.address || null,
        streetNumber: addressPayload.streetNumber || addressPayload.number || null,
        apartmentNumber: addressPayload.apartmentNumber || addressPayload.aptNumber || null,
        propertyType: addressPayload.propertyType || null,
        additionalInfo: addressPayload.additionalInfo || null,
        postalCode: addressPayload.postalCode || null,
        country: addressPayload.country || 'CL'
      },
      notes: notes || null
    };

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
        status: 'pending',
        paymentMethod: payment?.method || 'mercadopago',
        paymentStatus: payment?.status || 'pending',
        shippingAddress,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Actualizar stock de productos
    for (const item of normalizedItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    // TODO: Enviar email de confirmación
    // await sendOrderConfirmationEmail(order, customer);

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error al crear la orden' });
  }
});

// PUT /api/orders/:id - Actualizar estado de una orden
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Solo permitir ciertos cambios de estado
    const allowedStatuses = ['pending', 'confirmed', 'cancelled'];
    const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    const updateData = {};
    if (status && allowedStatuses.includes(status)) {
      updateData.status = status;
    }
    if (paymentStatus && allowedPaymentStatuses.includes(paymentStatus)) {
      updateData.paymentStatus = paymentStatus;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
});

// GET /api/orders/admin/all - Obtener todas las órdenes (solo admin)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    // Verificar si el usuario es admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { page = 1, limit = 10, status, paymentStatus } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

// PUT /api/orders/admin/:id - Actualizar orden (solo admin)
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar si el usuario es admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { status, paymentStatus } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
});

module.exports = router;