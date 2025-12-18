const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const config = require('../config/app');
const emailService = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Configuración de MercadoPago (usa variables de entorno)
const MERCADOPAGO_CONFIG = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'YOUR_MERCADOPAGO_ACCESS_TOKEN',
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || 'YOUR_MERCADOPAGO_PUBLIC_KEY',
  webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || `${config.apiBaseUrl}/api/payments/webhook`,
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || null
};

// Función para validar si una URL es HTTPS (requerido para auto_return)
const isHttpsUrl = (url) => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

let mercadoPagoClient = null;
let preferenceClient = null;
let paymentClient = null;

if (MERCADOPAGO_CONFIG.accessToken && MERCADOPAGO_CONFIG.accessToken !== 'YOUR_MERCADOPAGO_ACCESS_TOKEN') {
  mercadoPagoClient = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_CONFIG.accessToken,
    options: {
      timeout: 10000,
      idempotencyKey: undefined
    }
  });
  preferenceClient = new Preference(mercadoPagoClient);
  paymentClient = new Payment(mercadoPagoClient);
} else {
  console.warn('⚠️ MercadoPago access token no configurado. La integración de pagos estará deshabilitada.');
}

const isTestMode = () => MERCADOPAGO_CONFIG.accessToken?.startsWith('TEST-');

// GET /api/payments/mercadopago/config - Obtener configuración pública (público, no requiere autenticación)
router.get('/mercadopago/config', (req, res) => {
  if (!MERCADOPAGO_CONFIG.publicKey || MERCADOPAGO_CONFIG.publicKey === 'YOUR_MERCADOPAGO_PUBLIC_KEY') {
    return res.status(503).json({ error: 'MercadoPago no está configurado' });
  }

  res.json({
    publicKey: MERCADOPAGO_CONFIG.publicKey,
    mode: isTestMode() ? 'test' : 'production',
    locale: 'es-CL'
  });
});

// POST /api/payments/mercadopago/create - Crear preferencia de pago (permite sin autenticación)
router.post('/mercadopago/create', optionalAuth, async (req, res) => {
  try {
    if (!preferenceClient) {
      return res.status(503).json({ error: 'MercadoPago no está configurado' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'ID de orden es requerido' });
    }

    // Obtener la orden
    // Si el usuario está autenticado, verificar que la orden le pertenece
    // Si no está autenticado, solo obtener la orden (la validación de email se hace en el checkout)
    const orderWhere = req.user
      ? { id: orderId, userId: req.user.id }
      : { id: orderId };

    // Optimizar consulta: solo obtener los campos necesarios
    const order = await prisma.order.findFirst({
      where: orderWhere,
      select: {
        id: true,
        userId: true,
        shippingAddress: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const shippingInfo = order.shippingAddress || {};
    const contactInfo = shippingInfo.contact || {};
    const addressInfo = shippingInfo.address || {};

    const payerName = `${contactInfo.firstName || ''} ${contactInfo.lastName || ''}`.trim() || `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
    const payerEmail = contactInfo.email || order.user.email;
    const payerPhone = contactInfo.phone || order.user.phone || '';
    const sanitizedPhone = payerPhone ? payerPhone.replace(/\D/g, '').replace(/^56/, '') : '';

    const successUrl = `${config.frontendUrl}/checkout/success?orderId=${order.id}`;
    const failureUrl = `${config.frontendUrl}/checkout/failure?orderId=${order.id}`;
    const pendingUrl = `${config.frontendUrl}/checkout/pending?orderId=${order.id}`;

    // Usar MERCADOPAGO_WEBHOOK_URL si está configurado, sino usar la URL por defecto
    const webhookUrl = MERCADOPAGO_CONFIG.webhookUrl;

    // auto_return requiere HTTPS en producción. Si la URL es HTTPS, activar auto_return
    // Esto permite que Mercado Pago redirija automáticamente al usuario después del pago
    const shouldAutoReturn = isHttpsUrl(successUrl);

    console.log(`📝 Creando preferencia MercadoPago para orden ${order.id}`);
    console.log(`   - Success URL: ${successUrl}`);
    console.log(`   - Failure URL: ${failureUrl}`);
    console.log(`   - Pending URL: ${pendingUrl}`);
    console.log(`   - Webhook URL: ${webhookUrl}`);
    console.log(`   - Auto Return: ${shouldAutoReturn ? 'enabled (approved)' : 'disabled'} (requiere HTTPS)`);
    if (!shouldAutoReturn) {
      console.warn(`⚠️ Auto Return deshabilitado: La URL de éxito no es HTTPS (${successUrl})`);
    }

    // Crear preferencia de MercadoPago
    const preference = {
      items: order.items.map(item => ({
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'CLP'
      })),
      payer: {
        name: payerName || undefined,
        email: payerEmail,
        phone: {
          area_code: '56',
          number: sanitizedPhone || undefined
        },
        address: {
          street_name: addressInfo.street || (shippingInfo.method === 'pickup' ? 'Retiro en tienda' : ''),
          zip_code: addressInfo.postalCode || '',
          city_name: addressInfo.comuna || addressInfo.city || '',
          state_name: addressInfo.region || ''
        }
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: shouldAutoReturn ? 'approved' : undefined,
      external_reference: order.id,
      notification_url: webhookUrl,
      shipments: shippingInfo.method === 'pickup' ? undefined : {
        mode: 'not_specified',
        cost: shippingInfo.cost || 0,
        receiver_address: {
          zip_code: addressInfo.postalCode || '',
          street_name: addressInfo.street || '',
          street_number: addressInfo.streetNumber || '',
          city_name: addressInfo.comuna || addressInfo.city || '',
          state_name: addressInfo.region || '',
          country_name: addressInfo.country || 'CL'
        }
      },
      metadata: {
        order_id: order.id,
        user_id: order.userId,
        shipping_method: shippingInfo.method || null
      },
      statement_descriptor: 'TESSCO CHILE',
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }
        ]
      }
    };

    const response = await preferenceClient.create({ body: preference });

    // Actualizar la orden con la preferencia de pago
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: 'mercadopago',
        paymentStatus: 'pending'
      }
    });

    res.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      mode: isTestMode() ? 'test' : 'production',
      publicKey: MERCADOPAGO_CONFIG.publicKey
    });

  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

// GET /api/payments/webhook - Verificar que el endpoint está accesible
router.get('/webhook', (req, res) => {
  res.status(200).json({
    message: 'Webhook endpoint está activo y accesible',
    endpoint: '/api/payments/webhook',
    method: 'POST',
    expectedUrl: MERCADOPAGO_CONFIG.webhookUrl || `${config.apiBaseUrl}/api/payments/webhook`,
    timestamp: new Date().toISOString()
  });
});

// POST /api/payments/webhook - Webhook de MercadoPago
router.post('/webhook', async (req, res) => {
  try {
    if (!paymentClient) {
      console.warn('⚠️ Webhook recibido pero MercadoPago no está configurado.');
      return res.status(503).json({ error: 'MercadoPago no está configurado' });
    }

    // Log del webhook recibido para debugging
    console.log('📥 Webhook recibido de MercadoPago:', {
      query: req.query,
      bodyType: typeof req.body,
      hasData: !!req.body?.data,
      headers: {
        'x-signature': req.headers['x-signature'],
        'x-request-id': req.headers['x-request-id']
      }
    });

    // Mercado Pago puede enviar notificaciones de diferentes formas:
    // 1. Query params: ?type=payment&data.id=123
    // 2. Body con data: { type: "payment", data: { id: "123" } }
    // 3. Body directo: { id: "123" }
    const paymentId = req.body?.data?.id || req.query['data.id'] || req.body?.id;
    const topic = req.query.type || req.body.type || req.query.topic || req.body.topic;
    const action = req.body?.action || req.query.action || '';

    // Solo procesar si es una notificación de pago
    const isPaymentNotification = (topic && (topic.includes('payment') || topic === 'payment')) ||
                                  (action && action.includes('payment')) ||
                                  paymentId;

    if (!isPaymentNotification) {
      console.log('ℹ️ Webhook recibido pero no es una notificación de pago. Topic:', topic, 'Action:', action);
      return res.status(200).json({ received: true });
    }

    if (!paymentId) {
      console.warn('⚠️ Webhook de pago recibido pero no se pudo extraer el paymentId');
      return res.status(200).json({ received: true });
    }

    console.log(`🔍 Buscando pago ${paymentId} en MercadoPago...`);

    let payment = null;
    try {
      payment = await paymentClient.get({ id: paymentId });
    } catch (paymentError) {
      console.error(`❌ Error obteniendo pago ${paymentId} desde MercadoPago:`, paymentError);
      // Si no podemos obtener el pago, aún así responder 200 para que Mercado Pago no reintente
      return res.status(200).json({ received: true, error: 'No se pudo obtener el pago' });
    }

    if (!payment) {
      console.warn(`⚠️ Pago ${paymentId} no encontrado en MercadoPago`);
      return res.status(200).json({ received: true });
    }

    if (!payment.external_reference) {
      console.warn(`⚠️ Pago ${paymentId} recibido sin external_reference (orderId)`);
      return res.status(200).json({ received: true });
    }

    const orderId = payment.external_reference;
    const status = payment.status;

    console.log(`📋 Procesando webhook para orden ${orderId}, estado: ${status}`);

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingOrder) {
      console.warn(`⚠️ Orden ${orderId} no encontrada al procesar webhook.`);
      return res.status(200).json({ received: true });
    }

    // Mapear estados de Mercado Pago a estados de nuestra aplicación
    let paymentStatus = 'pending';
    let orderStatus = existingOrder.status;

    switch (status) {
      case 'approved':
        paymentStatus = 'paid';
        orderStatus = 'confirmed';
        break;
      case 'rejected':
      case 'cancelled':
        paymentStatus = 'failed';
        orderStatus = 'cancelled';
        break;
      case 'refunded':
      case 'charged_back':
        paymentStatus = 'refunded';
        break;
      case 'in_process':
      case 'pending':
      case 'authorized':
        paymentStatus = 'pending';
        break;
      default:
        paymentStatus = 'pending';
        console.log(`⚠️ Estado de pago desconocido: ${status}, marcando como pending`);
    }

    const updateData = {
      paymentStatus,
      status: orderStatus
    };

    try {
      const wasPaid = existingOrder.paymentStatus === 'paid';
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log(`✅ Orden ${orderId} actualizada: paymentStatus=${paymentStatus}, status=${orderStatus}`);

      // Enviar emails solo si el pago fue aprobado y antes no estaba pagado
      if (status === 'approved' && !wasPaid) {
        try {
          await Promise.all([
            emailService.sendOrderConfirmationEmail(updatedOrder),
            emailService.sendOrderNotificationEmail(updatedOrder)
          ]);
          console.log(`📧 Emails de confirmación enviados para orden ${orderId}`);
        } catch (emailError) {
          console.error(`❌ Error enviando emails para orden ${orderId}:`, emailError);
          // No fallar el webhook por errores de email
        }
      }
    } catch (updateError) {
      console.error(`❌ No se pudo actualizar la orden ${orderId}:`, updateError);
      // Responder 200 para evitar reintentos de Mercado Pago si el error es de nuestra DB
      return res.status(200).json({ received: true, error: 'Error actualizando orden' });
    }

    console.log(`✅ MercadoPago webhook procesado exitosamente. Orden ${orderId} -> ${status} (${paymentStatus})`);
    res.status(200).json({ received: true, orderId, status: paymentStatus });
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    // Responder 200 para evitar reintentos excesivos de Mercado Pago
    res.status(200).json({ received: true, error: 'Error al procesar el webhook' });
  }
});

// POST /api/payments/mercadopago/confirm - Confirmar pago al regresar desde MercadoPago (permite sin autenticación)
router.post('/mercadopago/confirm', optionalAuth, async (req, res) => {
  try {
    if (!paymentClient) {
      return res.status(503).json({ error: 'MercadoPago no está configurado' });
    }

    const { paymentId, orderId: providedOrderId, statusHint, preferenceId } = req.body || {};

    if (!paymentId && !providedOrderId && !preferenceId) {
      return res.status(400).json({ error: 'Se requiere al menos paymentId, orderId o preferenceId' });
    }

    let payment = null;

    async function searchPaymentBy(criteria) {
      try {
        const searchResult = await paymentClient.search({
          qs: {
            ...criteria,
            sort: 'date_created',
            criteria: 'desc'
          }
        });

        if (searchResult && Array.isArray(searchResult.results) && searchResult.results.length > 0) {
          return searchResult.results[0];
        }
      } catch (error) {
        console.error('❌ Error buscando pago en MercadoPago:', error);
      }
      return null;
    }

    if (paymentId) {
      try {
        payment = await paymentClient.get({ id: paymentId });
      } catch (error) {
        console.error(`❌ Error obteniendo pago ${paymentId} desde MercadoPago:`, error);
      }
    }

    if (!payment && preferenceId) {
      payment = await searchPaymentBy({ preference_id: preferenceId });
    }

    const targetOrderId = payment?.external_reference || providedOrderId;

    if (!payment && targetOrderId) {
      payment = await searchPaymentBy({ external_reference: targetOrderId });
    }

    if (!payment && !targetOrderId) {
      return res.status(404).json({ error: 'No se pudo determinar el pago en MercadoPago' });
    }

    if (!targetOrderId) {
      return res.status(400).json({ error: 'No se pudo determinar la orden asociada al pago' });
    }

    // Si el usuario está autenticado, verificar que la orden le pertenece
    // Si no está autenticado, solo obtener la orden por ID (permitir verificación de estado)
    const orderWhere = req.user
      ? { id: targetOrderId, userId: req.user.id }
      : { id: targetOrderId };

    const existingOrder = await prisma.order.findFirst({
      where: orderWhere,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const mercadoPagoStatus = payment?.status || statusHint || existingOrder.paymentStatus || 'pending';

    const normalizedStatus = mercadoPagoStatus === 'approved'
      ? 'paid'
      : mercadoPagoStatus === 'rejected'
        ? 'failed'
        : mercadoPagoStatus === 'in_process' || mercadoPagoStatus === 'authorized'
          ? 'pending'
          : mercadoPagoStatus;

    const updateData = {
      paymentStatus: normalizedStatus
    };

    if (normalizedStatus === 'paid') {
      updateData.status = 'confirmed';
    } else if (normalizedStatus === 'failed') {
      updateData.status = 'cancelled';
    }

    const wasPaid = existingOrder.paymentStatus === 'paid';

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (normalizedStatus === 'paid' && !wasPaid) {
      await Promise.all([
        emailService.sendOrderConfirmationEmail(updatedOrder),
        emailService.sendOrderNotificationEmail(updatedOrder)
      ]).catch(error => {
        console.error('❌ Error enviando emails de confirmación tras confirmar el pago:', error);
      });
    }

    return res.json({
      order: updatedOrder,
      paymentStatus: normalizedStatus
    });
  } catch (error) {
    console.error('Error confirming MercadoPago payment:', error);
    res.status(500).json({ error: 'Error al confirmar el pago con MercadoPago' });
  }
});

// GET /api/payments/status/:orderId - Verificar estado del pago (permite sin autenticación)
router.get('/status/:orderId', optionalAuth, async (req, res) => {
  try {
    // Si el usuario está autenticado, verificar que la orden le pertenece
    // Si no está autenticado, solo obtener la orden por ID (permitir verificación de estado)
    const orderWhere = req.user
      ? { id: req.params.orderId, userId: req.user.id }
      : { id: req.params.orderId };

    const order = await prisma.order.findFirst({
      where: orderWhere,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Error al verificar el estado del pago' });
  }
});

// POST /api/payments/bank-transfer - Procesar transferencia bancaria
router.post('/bank-transfer', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'ID de orden es requerido' });
    }

    // Obtener la orden
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Generar instrucciones de transferencia bancaria
    const bankTransferInfo = {
      bankName: 'Banco de Chile',
      accountType: 'Cuenta Corriente',
      accountNumber: '12345678901',
      rut: '12.345.678-9',
      accountHolder: 'Tessco Chile SpA',
      amount: order.total,
      reference: `Orden ${order.id}`,
      instructions: [
        'Realiza la transferencia por el monto exacto indicado',
        'Usa el número de orden como referencia',
        'Envía el comprobante a contacto@tesscochile.cl',
        'Tu pedido será procesado una vez confirmado el pago'
      ]
    };

    res.json(bankTransferInfo);
  } catch (error) {
    console.error('Error processing bank transfer:', error);
    res.status(500).json({ error: 'Error al procesar la transferencia bancaria' });
  }
});

module.exports = router;