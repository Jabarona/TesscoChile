// Configuración del E-commerce Tessco Chile
const ECOMMERCE_CONFIG = {
  // Información de la empresa
  company: {
    name: "Tessco Chile",
    description: "Tu tienda de tecnología y accesorios",
    email: "contacto@tesscochile.cl",
    phone: "+56 9 1234 5678",
    address: "Santiago, Chile"
  },
  
  // Configuración de productos
  products: {
    categories: [
      { id: 1, name: "Notebooks", slug: "notebooks" },
      { id: 2, name: "Smartphones", slug: "smartphones" },
      { id: 3, name: "Accesorios", slug: "accesorios" },
      { id: 4, name: "Monitores", slug: "monitores" }
    ],
    currency: "CLP",
    currencySymbol: "$"
  },
  
  // Configuración del carrito
  cart: {
    storageKey: "tessco_cart",
    maxItems: 50
  },
  
  // Configuración de pagos
  payments: {
    mercadoPago: {
      publicKey: "YOUR_MERCADOPAGO_PUBLIC_KEY",
      sandbox: true
    }
  },
  
  // Configuración de envíos
  shipping: {
    freeShippingMin: 50000, // CLP
    shippingCost: 5000 // CLP
  },
  
  // Configuración de la API
  api: {
    baseUrl: "https://api.tesscochile.cl/graphql",
    timeout: 10000
  }
};

// Funciones auxiliares para el e-commerce
function formatPrice(price) {
  return `${ECOMMERCE_CONFIG.products.currencySymbol}${price.toLocaleString('es-CL')}`;
}

function formatCurrency(amount) {
  return `$${amount.toLocaleString('es-CL')}`;
}

function showNotification(message, type = 'success') {
  // Si existe cartOffcanvas, usar su sistema de notificaciones
  if (window.cartOffcanvas && typeof window.cartOffcanvas.showNotification === 'function') {
    window.cartOffcanvas.showNotification(message, type);
    return;
  }
  
  // Fallback: crear notificación toast estilo Bootstrap
  const toastContainer = document.querySelector('.toast-container') || createToastContainer();
  
  // Iconos según el tipo
  const icons = {
    success: '<i class="fas fa-check-circle me-2"></i>',
    warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
    danger: '<i class="fas fa-times-circle me-2"></i>',
    info: '<i class="fas fa-info-circle me-2"></i>'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="toast-body d-flex align-items-center">
        ${icons[type] || icons.info}
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Usar Bootstrap Toast si está disponible
  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    const bsToast = new bootstrap.Toast(toast, { delay: 3500 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  } else {
    // Fallback simple
    toast.classList.add('show');
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container position-fixed bottom-0 start-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

// Exportar para uso global
window.ECOMMERCE_CONFIG = ECOMMERCE_CONFIG;
window.formatPrice = formatPrice;
window.formatCurrency = formatCurrency;
window.showNotification = showNotification;