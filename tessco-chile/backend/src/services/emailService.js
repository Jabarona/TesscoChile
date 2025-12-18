const nodemailer = require('nodemailer');
const config = require('../config/app');

let transporter = null;
let isConfigured = false;

function ensureTransporter() {
  if (transporter || isConfigured) {
    return transporter;
  }

  const { smtp } = config;

  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.warn('⚠️ SMTP no está completamente configurado. Emails deshabilitados.');
    isConfigured = true;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });

  isConfigured = true;
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const activeTransporter = ensureTransporter();

  if (!activeTransporter) {
    console.warn(`⚠️ Email no enviado. Falta configuración SMTP para "${subject}".`);
    return;
  }

  const from = config.smtp.fromEmail
    ? `"${config.smtp.fromName || 'Tessco Chile'}" <${config.smtp.fromEmail}>`
    : config.smtp.user;

  try {
    await activeTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    console.log(`✉️ Email enviado a ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount);
}

function formatOrderHtml(order) {
  const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${item.product?.name || item.name}</td>
        <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

  const shipping = order.shippingAddress || {};
  const address = shipping.address || {};
  const contact = shipping.contact || {};

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #FF6B35;">Detalle de tu compra</h2>
      <p>Orden: <strong>#${order.id}</strong></p>
      <p>Fecha: <strong>${new Date(order.createdAt).toLocaleString('es-CL')}</strong></p>
      <p>Total: <strong>${formatCurrency(order.total)}</strong></p>
      <p>Estado de pago: <strong>${order.paymentStatus}</strong></p>

      <h3 style="color: #FF6B35;">Productos</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f6f6f6; text-align: left;">Producto</th>
            <th style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f6f6f6;">Cantidad</th>
            <th style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f6f6f6; text-align: right;">Precio</th>
            <th style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f6f6f6; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="color: #FF6B35; margin-top: 24px;">Información de entrega</h3>
      <p>Método: <strong>${shipping.method === 'pickup' ? 'Retiro en tienda' : 'Despacho a domicilio'}</strong></p>
      ${shipping.method === 'pickup' ? '' : `
        <p>Dirección: <strong>${address.street || ''} ${address.streetNumber || ''}, ${address.comuna || ''}, ${address.region || ''}</strong></p>
        ${address.apartmentNumber ? `<p>Departamento: <strong>${address.apartmentNumber}</strong></p>` : ''}
        ${address.additionalInfo ? `<p>Información adicional: <strong>${address.additionalInfo}</strong></p>` : ''}
      `}

      <h3 style="color: #FF6B35; margin-top: 24px;">Contacto</h3>
      <p>Nombre: <strong>${contact.firstName || ''} ${contact.lastName || ''}</strong></p>
      <p>Email: <strong>${contact.email || order.user?.email || ''}</strong></p>
      ${contact.phone ? `<p>Teléfono: <strong>${contact.phone}</strong></p>` : ''}

      <p style="margin-top: 32px;">Gracias por comprar en Tessco Chile.</p>
    </div>
  `;
}

function formatOrderText(order) {
  const itemsText = order.items.map(item => {
    const name = item.product?.name || item.name;
    return `- ${name} x${item.quantity} (${formatCurrency(item.total)})`;
  }).join('\n');

  const shipping = order.shippingAddress || {};
  const address = shipping.address || {};
  const contact = shipping.contact || {};

  return [
    `Orden #${order.id}`,
    `Fecha: ${new Date(order.createdAt).toLocaleString('es-CL')}`,
    `Total: ${formatCurrency(order.total)}`,
    `Estado de pago: ${order.paymentStatus}`,
    '',
    'Productos:',
    itemsText,
    '',
    `Método de entrega: ${shipping.method === 'pickup' ? 'Retiro en tienda' : 'Despacho a domicilio'}`,
    shipping.method === 'pickup' ? '' : `Dirección: ${address.street || ''} ${address.streetNumber || ''}, ${address.comuna || ''}, ${address.region || ''}`,
    contact.phone ? `Teléfono: ${contact.phone}` : '',
    '',
    'Gracias por comprar en Tessco Chile.'
  ].filter(Boolean).join('\n');
}

async function sendOrderConfirmationEmail(order) {
  const recipient = order.user?.email || order.shippingAddress?.contact?.email;
  if (!recipient) {
    console.warn(`⚠️ Orden ${order.id} no tiene email de usuario. No se enviará confirmación.`);
    return;
  }

  const subject = `Confirmación de compra - Orden #${order.id}`;
  const html = formatOrderHtml(order);
  const text = formatOrderText(order);

  await sendEmail({ to: recipient, subject, html, text });
}

async function sendOrderNotificationEmail(order) {
  const notificationEmail = config.notificationEmail;
  if (!notificationEmail) {
    console.warn('⚠️ SALES_NOTIFICATION_EMAIL no está configurado. No se enviará notificación interna.');
    return;
  }

  const subject = `Nueva orden recibida - #${order.id}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #FF6B35;">Nueva orden recibida</h2>
      ${formatOrderHtml(order)}
    </div>
  `;
  const text = `Nueva orden recibida:\n\n${formatOrderText(order)}`;

  await sendEmail({ to: notificationEmail, subject, html, text });
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderNotificationEmail
};

