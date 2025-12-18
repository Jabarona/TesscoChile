// Cart Offcanvas Manager - Tessco Chile
class CartOffcanvas {
  constructor() {
    this.shippingCost = 5000; // CLP (valor por defecto, se actualizará desde la API)
    this.freeShippingMin = 50000; // CLP (valor por defecto, se actualizará desde la API)
    this.loadShippingSettings();
    this.init();
  }
  
  async loadShippingSettings() {
    try {
      const apiUrl = (window.config && window.config.apiBaseUrl) || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.data || {};
        
        if (settings.shippingCost) {
          this.shippingCost = parseFloat(settings.shippingCost) || 5000;
        }
        if (settings.freeShippingThreshold) {
          this.freeShippingMin = parseFloat(settings.freeShippingThreshold) || 50000;
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudo cargar la configuración de envío, usando valores por defecto:', error);
    }
  }

  init() {
    console.log('🚀 Inicializando CartOffcanvas...');
    
    // Escuchar cuando el header se cargue
    window.addEventListener('header:loaded', () => {
      console.log('📢 Header cargado, configurando listeners...');
      this.setupListeners();
    });
    
    // Si el header ya está cargado, configurar listeners inmediatamente
    if (document.getElementById('offcanvasCart')) {
      console.log('📢 Header ya presente, configurando listeners...');
      this.setupListeners();
    }
    
    // Actualizar badge inicial (funciona aunque el header no esté listo)
    this.updateCartBadge();
  }

  setupListeners() {
    // Escuchar cuando se abre el offcanvas
    const offcanvasElement = document.getElementById('offcanvasCart');
    if (offcanvasElement) {
      offcanvasElement.addEventListener('show.bs.offcanvas', () => {
        console.log('🛒 Offcanvas abierto, cargando items...');
        this.loadCartItems();
      });
      console.log('✅ Listener de offcanvas configurado');
    }

    // Actualizar el carrito cuando cambie el localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'tessco_cart') {
        console.log('🔄 Storage changed, actualizando...');
        this.updateCartBadge();
      }
    });

    // Escuchar eventos personalizados del carrito
    window.addEventListener('cart:updated', () => {
      console.log('🔄 Cart updated event, actualizando...');
      this.updateCartBadge();
      this.loadCartItems();
    });

    // Actualizar badge ahora que el header está listo
    this.updateCartBadge();
    
    console.log('✅ CartOffcanvas configurado completamente');
  }

  getCartItems() {
    try {
      const stored = localStorage.getItem('tessco_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return [];
    }
  }

  saveCartItems(items) {
    try {
      localStorage.setItem('tessco_cart', JSON.stringify(items));
      this.updateCartBadge();
      
      // Disparar evento personalizado para que otras partes de la app se enteren
      window.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: { items, count: this.getItemCount(items) } 
      }));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  getItemCount(items = null) {
    const cartItems = items || this.getCartItems();
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  getSubtotal(items = null) {
    const cartItems = items || this.getCartItems();
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getShippingCost(subtotal) {
    return subtotal >= this.freeShippingMin ? 0 : this.shippingCost;
  }

  getTotal(items = null) {
    const subtotal = this.getSubtotal(items);
    const shipping = this.getShippingCost(subtotal);
    return subtotal + shipping;
  }

  updateCartBadge() {
    const items = this.getCartItems();
    const count = this.getItemCount(items);
    
    console.log('🔢 Actualizando badge del carrito. Items:', items.length, 'Cantidad total:', count);
    
    // Actualizar todos los badges del carrito
    const badges = document.querySelectorAll('.nav-cart-badge');
    console.log('🏷️ Badges encontrados:', badges.length);
    
    if (badges.length === 0) {
      console.warn('⚠️ No se encontraron badges del carrito en el DOM');
    }
    
    badges.forEach((badge, index) => {
      console.log(`🏷️ Actualizando badge ${index + 1}:`, badge);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    });
    
    console.log('✅ Badge actualizado con', count, 'items');
  }

  loadCartItems() {
    const items = this.getCartItems();
    console.log('📦 Items en el carrito:', items);
    
    const emptyState = document.getElementById('empty-cart-offcanvas');
    const itemsContainer = document.getElementById('cart-items-container');

    console.log('🔍 Empty state element:', emptyState);
    console.log('🔍 Items container element:', itemsContainer);

    if (items.length === 0) {
      console.log('❌ Carrito vacío, mostrando estado vacío');
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
      if (itemsContainer) {
        itemsContainer.classList.remove('show');
      }
      return;
    }

    console.log(`✅ ${items.length} items en el carrito, renderizando...`);
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    if (itemsContainer) {
      itemsContainer.classList.add('show');
    }

    this.renderCartItems(items);
    this.updateSummary(items);
  }

  renderCartItems(items) {
    const container = document.getElementById('offcanvas-cart-items');
    if (!container) return;

    container.innerHTML = '';

    items.forEach((item, index) => {
      const itemElement = this.createCartItemElement(item, index);
      container.appendChild(itemElement);
    });
  }

  createCartItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'offcanvas-cart-item';
    div.style.animationDelay = `${index * 0.05}s`;
    
    div.innerHTML = `
      <div class="d-flex">
        <img src="${item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%22105%22 text-anchor=%22middle%22 x=%22100%22%3ENo Image%3C/text%3E%3C/svg%3E'}" 
             alt="${item.name}" 
             class="offcanvas-cart-item-image"
             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%22'24%22 dy=%22105%22 text-anchor=%22middle%22 x=%22100%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="offcanvas-cart-item-info">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="offcanvas-cart-item-name">${item.name}</h6>
            <button class="offcanvas-cart-item-remove" onclick="cartOffcanvas.removeItem('${item.id}')" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="offcanvas-cart-item-price">$${item.price.toLocaleString('es-CL')}</div>
          <div class="offcanvas-cart-item-quantity">
            <button class="offcanvas-quantity-btn" onclick="cartOffcanvas.updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <span class="offcanvas-quantity-value">${item.quantity}</span>
            <button class="offcanvas-quantity-btn" onclick="cartOffcanvas.updateQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= (item.stock || 999) ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    return div;
  }

  updateSummary(items) {
    const subtotal = this.getSubtotal(items);
    const shipping = this.getShippingCost(subtotal);
    const total = this.getTotal(items);

    const subtotalElement = document.getElementById('offcanvas-subtotal');
    const shippingElement = document.getElementById('offcanvas-shipping');
    const totalElement = document.getElementById('offcanvas-total');

    if (subtotalElement) {
      subtotalElement.textContent = `$${subtotal.toLocaleString('es-CL')}`;
    }

    if (shippingElement) {
      if (shipping === 0) {
        shippingElement.innerHTML = '<span class="text-success fw-bold">¡Gratis!</span>';
      } else {
        shippingElement.textContent = `$${shipping.toLocaleString('es-CL')}`;
      }
    }

    if (totalElement) {
      totalElement.textContent = `$${total.toLocaleString('es-CL')}`;
    }
  }

  updateQuantity(productId, newQuantity) {
    const items = this.getCartItems();
    const item = items.find(i => i.id === productId);

    if (!item) return;

    if (newQuantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const maxStock = item.stock || 999;
    if (newQuantity > maxStock) {
      this.showNotification(`Solo hay ${maxStock} unidades disponibles`, 'warning');
      return;
    }

    item.quantity = newQuantity;
    this.saveCartItems(items);
    this.loadCartItems();
  }

  removeItem(productId) {
    let items = this.getCartItems();
    items = items.filter(item => item.id !== productId);
    this.saveCartItems(items);
    this.loadCartItems();
    this.showNotification('Producto eliminado del carrito', 'info');
  }

  showNotification(message, type = 'info') {
    // Crear notificación toast
    const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
    
    // Iconos según el tipo
    const icons = {
      success: '<i class="fas fa-check-circle me-2"></i>',
      warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
      info: '<i class="fas fa-info-circle me-2"></i>',
      error: '<i class="fas fa-times-circle me-2"></i>'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'} border-0`;
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
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3500 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed bottom-0 start-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  window.cartOffcanvas = new CartOffcanvas();
});

// Función global para agregar al carrito desde cualquier página
function addToCart(productId, quantity = 1) {
  console.log('🛒 addToCart llamado:', productId, quantity);
  
  const quantityInput = document.getElementById('quantity');
  const finalQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : quantity;

  console.log('📊 Cantidad final:', finalQuantity);

  // Obtener información del producto
  const apiUrl = (window.config && window.config.apiBaseUrl) || (window.ECOMMERCE_CONFIG?.API_URL) || 'http://localhost:4000';
  fetch(`${apiUrl}/api/products/${productId}`)
    .then(response => {
      console.log('📡 Respuesta de la API:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📦 Datos del producto:', data);
      const product = data.data || data;
      
      const cartItems = JSON.parse(localStorage.getItem('tessco_cart') || '[]');
      console.log('🛒 Items actuales:', cartItems);
      
      const existingItem = cartItems.find(item => item.id === productId);

      if (existingItem) {
        console.log('✏️ Producto ya existe, incrementando cantidad');
        existingItem.quantity += finalQuantity;
      } else {
        console.log('➕ Agregando nuevo producto');
        cartItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: finalQuantity,
          stock: product.stock || 999
        });
      }

      console.log('💾 Guardando en localStorage:', cartItems);
      localStorage.setItem('tessco_cart', JSON.stringify(cartItems));
      
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: { items: cartItems, count: cartItems.reduce((c, i) => c + i.quantity, 0) } 
      }));
      
      // Actualizar badge
      if (window.cartOffcanvas) {
        console.log('🔄 Actualizando badge...');
        window.cartOffcanvas.updateCartBadge();
      }

      // Mostrar notificación
      if (window.cartOffcanvas) {
        window.cartOffcanvas.showNotification(`${product.name} agregado al carrito`, 'success');
      }

      // Abrir el offcanvas del carrito
      const offcanvasElement = document.getElementById('offcanvasCart');
      if (offcanvasElement) {
        console.log('🎯 Abriendo offcanvas...');
        const bsOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
        bsOffcanvas.show();
      } else {
        console.error('❌ No se encontró el elemento offcanvasCart');
      }
    })
    .catch(error => {
      console.error('❌ Error al agregar al carrito:', error);
      if (window.cartOffcanvas) {
        window.cartOffcanvas.showNotification('Error al agregar el producto', 'warning');
      }
    });
}

// Export para uso global
if (typeof window !== 'undefined') {
  window.addToCart = addToCart;
}

