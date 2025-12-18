# 🔗 Guía: Configurar Webhook de Mercado Pago

Esta guía te mostrará paso a paso cómo configurar el webhook en el panel de Mercado Pago para recibir notificaciones de pagos.

## 📋 Información Necesaria

Antes de comenzar, necesitas tener:

1. **URL de tu Webhook**: 
   ```
   https://giraldosa-tessco-chile-production.up.railway.app/api/payments/webhook
   ```
   ⚠️ **IMPORTANTE**: Esta URL debe ser HTTPS (no HTTP) y debe ser accesible públicamente.

2. **Credenciales de Mercado Pago**:
   - Access Token (ya lo tienes configurado)
   - Public Key (ya lo tienes configurado)

## 🚀 Pasos para Configurar el Webhook

### Paso 1: Acceder al Panel de Mercado Pago

1. Inicia sesión en tu cuenta de Mercado Pago:
   - Ve a: https://www.mercadopago.com.ar/developers
   - O accede desde: https://www.mercadopago.cl/developers (para Chile)

### Paso 2: Ir a Tus Integraciones

1. En el panel de desarrolladores, haz clic en **"Tus integraciones"** o **"My integrations"**
2. Selecciona la aplicación que corresponde a tu tienda
   - Si no tienes una aplicación creada, deberás crear una primero

### Paso 3: Configurar el Webhook

1. En el menú lateral de tu aplicación, busca la opción **"Webhooks"** o **"Notificaciones IPN"**
2. Haz clic en **"Configurar notificaciones"** o **"Configure notifications"**

### Paso 4: Agregar la URL del Webhook

1. **Para Modo Producción**:
   - En el campo "URL de producción" o "Production URL", ingresa:
     ```
     https://giraldosa-tessco-chile-production.up.railway.app/api/payments/webhook
     ```

2. **Para Modo Pruebas (Opcional pero recomendado)**:
   - En el campo "URL de pruebas" o "Test URL", puedes usar la misma URL o una de desarrollo:
     ```
     https://giraldosa-tessco-chile-production.up.railway.app/api/payments/webhook
     ```

### Paso 5: Seleccionar Eventos

Selecciona los eventos de los que deseas recibir notificaciones. Para pagos, necesitas:

- ✅ **Payments** (Pagos) - **OBLIGATORIO**
  - Esto enviará notificaciones cuando un pago cambie de estado

Opcionalmente puedes seleccionar:
- ⚪ **Preapproval** (Pagos recurrentes)
- ⚪ **Authorized payment** (Pagos autorizados)
- ⚪ **Invoice** (Facturas)

**Para tu caso, solo necesitas "Payments" ✅**

### Paso 6: Guardar la Configuración

1. Haz clic en **"Guardar"** o **"Save"**
2. Mercado Pago generará una **clave secreta** (secret) para validar las notificaciones
3. **IMPORTANTE**: Copia y guarda esta clave secreta de forma segura

### Paso 7: Configurar la Clave Secreta (Opcional)

Si Mercado Pago te proporciona una clave secreta para validar las notificaciones, puedes configurarla en tu `.env`:

```env
MERCADOPAGO_WEBHOOK_SECRET="tu-clave-secreta-aqui"
```

**Nota**: Actualmente tu código no valida la firma del webhook, pero es recomendable hacerlo para mayor seguridad.

## 🔍 Verificar que el Webhook Esté Funcionando

### Opción 1: Probar desde el Panel de Mercado Pago

1. En la sección de Webhooks, busca la opción **"Probar webhook"** o **"Test webhook"**
2. Selecciona un evento de prueba (por ejemplo, "Payment approved")
3. Mercado Pago enviará una notificación de prueba a tu URL
4. Verifica en los logs de tu servidor que se recibió la notificación

### Opción 2: Revisar los Logs de tu Servidor

Después de realizar un pago de prueba, revisa los logs de tu aplicación. Deberías ver algo como:

```
📥 Webhook recibido de MercadoPago: { ... }
🔍 Buscando pago 123456789 en MercadoPago...
📋 Procesando webhook para orden abc123, estado: approved
✅ Orden abc123 actualizada: paymentStatus=paid, status=confirmed
✅ MercadoPago webhook procesado exitosamente
```

### Opción 3: Verificar en el Panel de Mercado Pago

1. En la sección de Webhooks, verás un historial de notificaciones enviadas
2. Verifica que aparezcan las notificaciones con estado "200 OK" o "Success"

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: El webhook no se recibe

**Causas posibles:**
- La URL no es HTTPS (Mercado Pago requiere HTTPS)
- La URL no es accesible públicamente
- Hay un firewall bloqueando las peticiones

**Solución:**
- Verifica que tu URL sea HTTPS: `https://...`
- Prueba acceder a la URL desde tu navegador (debe responder, aunque sea con error)
- Verifica que Railway permita conexiones entrantes en la ruta `/api/payments/webhook`

### Problema 2: El webhook se recibe pero el estado no se actualiza

**Causas posibles:**
- Error en el procesamiento del webhook
- La orden no se encuentra en la base de datos
- Error en la actualización de la base de datos

**Solución:**
- Revisa los logs de tu servidor para ver el error específico
- Verifica que el `external_reference` en el pago coincida con el `orderId` en tu base de datos

### Problema 3: Recibo múltiples notificaciones para el mismo pago

**Esto es normal**: Mercado Pago puede enviar múltiples notificaciones para el mismo pago (por ejemplo, cuando cambia de "pending" a "approved"). Tu código ya maneja esto correctamente.

## 📝 Configuración Recomendada en Variables de Entorno

Asegúrate de tener estas variables configuradas en tu `.env` de producción:

```env
# URL del backend (debe ser HTTPS)
API_BASE_URL="https://giraldosa-tessco-chile-production.up.railway.app"

# URL del webhook (opcional, por defecto usa API_BASE_URL/api/payments/webhook)
MERCADOPAGO_WEBHOOK_URL="https://giraldosa-tessco-chile-production.up.railway.app/api/payments/webhook"

# Clave secreta del webhook (si Mercado Pago te la proporciona)
MERCADOPAGO_WEBHOOK_SECRET=""

# Access Token y Public Key (ya los tienes)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-7102714654523192-110714-45c1f168259555e9d8f7b068f876cf4f-802780405"
MERCADOPAGO_PUBLIC_KEY="APP_USR-767a463b-ff0b-454e-a171-c9bf0af15ba7"
```

## 🔐 Seguridad del Webhook

**Recomendación**: En el futuro, deberías implementar validación de la firma del webhook para asegurar que las notificaciones realmente vienen de Mercado Pago. Por ahora, tu código funciona pero es menos seguro.

Para implementar validación de firma, necesitarías:
1. Obtener la clave secreta del panel de Mercado Pago
2. Implementar la validación usando el header `x-signature` que Mercado Pago envía

## ✅ Checklist Final

Antes de dar por terminada la configuración, verifica:

- [ ] El webhook está configurado en el panel de Mercado Pago
- [ ] La URL del webhook es HTTPS
- [ ] La URL del webhook es accesible públicamente
- [ ] El evento "Payments" está seleccionado
- [ ] Realizaste un pago de prueba
- [ ] Los logs muestran que se recibió el webhook
- [ ] El estado del pago se actualizó correctamente en la base de datos
- [ ] El usuario puede ver el estado actualizado en la página de confirmación

## 📚 Recursos Adicionales

- [Documentación oficial de Webhooks de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/additional-content/your-integrations/notifications/webhooks)
- [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers)
- [Guía de Notificaciones IPN](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/ipn)

---

**¿Necesitas ayuda?** Si después de seguir estos pasos el webhook no funciona, revisa los logs de tu servidor y comparte el error específico para poder ayudarte mejor.

