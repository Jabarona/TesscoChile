// Carrito de Compras - Tessco Chile
class ShoppingCart {
  constructor() {
    this.items = this.loadFromStorage();
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
    this.updateCartUI();
    this.bindEvents();
    this.calculateTotals();
  }

  bindEvents() {
    // Checkout button
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      this.proceedToCheckout();
    });

    // Escuchar cambios en el carrito desde otras partes de la app
    window.addEventListener('cart:updated', (e) => {
      console.log('🔄 ShoppingCart: Evento cart:updated recibido, recargando desde localStorage');
      this.items = this.loadFromStorage();
      this.updateCartUI();
      this.calculateTotals();
    });

    // Escuchar cambios en localStorage (desde otras pestañas)
    window.addEventListener('storage', (e) => {
      if (e.key === 'tessco_cart') {
        console.log('🔄 ShoppingCart: localStorage changed, recargando');
        this.items = this.loadFromStorage();
        this.updateCartUI();
        this.calculateTotals();
      }
    });
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('tessco_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('tessco_cart', JSON.stringify(this.items));
      // Disparar evento personalizado para que otras partes de la app se enteren
      window.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: { items: this.items, count: this.getItemCount() } 
      }));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  addItem(product, quantity = 1) {
    // Recargar desde localStorage para asegurar que tenemos la versión más reciente
    this.items = this.loadFromStorage();
    console.log('🛒 ShoppingCart.addItem: Items actuales desde localStorage:', this.items.length);
    
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      console.log('✏️ ShoppingCart: Producto existe, incrementando cantidad');
      existingItem.quantity += quantity;
    } else {
      console.log('➕ ShoppingCart: Agregando nuevo producto');
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity,
        stock: product.stock || 999
      });
    }
    
    console.log('💾 ShoppingCart: Guardando', this.items.length, 'items');
    this.saveToStorage();
    this.updateCartUI();
    this.updateCartBadge();
  }

  removeItem(productId) {
    // Recargar desde localStorage primero
    this.items = this.loadFromStorage();
    console.log('🗑️ ShoppingCart.removeItem: Eliminando producto', productId);
    
    this.items = this.items.filter(item => item.id !== productId);
    
    console.log('💾 ShoppingCart: Quedan', this.items.length, 'items');
    this.saveToStorage();
    this.updateCartUI();
    this.updateCartBadge();
  }

  updateQuantity(productId, quantity) {
    // Recargar desde localStorage primero
    this.items = this.loadFromStorage();
    console.log('🔢 ShoppingCart.updateQuantity: Actualizando cantidad del producto', productId, 'a', quantity);
    
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else if (quantity <= item.stock) {
        item.quantity = quantity;
        this.saveToStorage();
        this.updateCartUI();
      } else {
        this.showNotification('No hay suficiente stock disponible', 'warning');
      }
    }
  }

  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateCartUI();
    this.updateCartBadge();
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  getShippingCost() {
    const subtotal = this.getTotal();
    return subtotal >= this.freeShippingMin ? 0 : this.shippingCost;
  }

  getFinalTotal() {
    return this.getTotal() + this.getShippingCost();
  }

  updateCartUI() {
    const loading = document.getElementById('loading');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');

    if (loading) loading.style.display = 'none';

    if (this.items.length === 0) {
      if (emptyCart) emptyCart.style.display = 'block';
      if (cartContent) cartContent.style.display = 'none';
      return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';

    this.renderCartItems();
    this.calculateTotals();
  }

  renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    this.items.forEach(item => {
      const cartItemElement = document.createElement('div');
      cartItemElement.className = 'cart-item';
      cartItemElement.innerHTML = `
        <div class="row align-items-center">
          <div class="col-lg-3 col-md-3">
            <img src="${item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%22105%22 text-anchor=%22middle%22 x=%22100%22%3ENo Image%3C/text%3E%3C/svg%3E'}" 
                 alt="${item.name}" 
                 class="product-image"
                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%22105%22 text-anchor=%22middle%22 x=%22100%22%3ENo Image%3C/text%3E%3C/svg%3E'">
          </div>
          <div class="col-lg-4 col-md-4">
            <h5 class="text-white mb-2">${item.name}</h5>
            <p class="text-light mb-1">
              <strong class="text-white">Precio unitario:</strong> <span class="text-primary">$${item.price.toLocaleString('es-CL')}</span>
            </p>
            <small class="text-light">Stock disponible: <span class="text-success">${item.stock}</span></small>
          </div>
          <div class="col-lg-3 col-md-3">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" 
                     class="quantity-input" 
                     value="${item.quantity}" 
                     min="1" 
                     max="${item.stock}"
                     onchange="cart.updateQuantity('${item.id}', parseInt(this.value))">
              <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          <div class="col-lg-2 col-md-2 text-center">
            <div class="item-total">
              <h6 class="text-primary mb-0 fs-5">
                $${(item.price * item.quantity).toLocaleString('es-CL')}
              </h6>
              <small class="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-12 text-end">
            <button class="remove-btn" onclick="cart.removeItem('${item.id}')" title="Eliminar producto">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(cartItemElement);
    });
  }

  calculateTotals() {
    const subtotal = this.getTotal();
    const shipping = this.getShippingCost();
    const total = this.getFinalTotal();

    // Update UI elements
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (subtotalElement) {
      subtotalElement.textContent = `$${subtotal.toLocaleString('es-CL')}`;
    }

    if (shippingElement) {
      if (shipping === 0) {
        shippingElement.innerHTML = '<span class="text-success">¡Envío gratis!</span>';
      } else {
        shippingElement.textContent = `$${shipping.toLocaleString('es-CL')}`;
      }
    }

    if (totalElement) {
      totalElement.textContent = `$${total.toLocaleString('es-CL')}`;
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = this.items.length === 0;
    }

    // Update item count
    this.updateCartBadge();
  }

  updateCartBadge() {
    const cartItemCount = document.getElementById('cart-item-count');
    const count = this.getItemCount();
    
    if (cartItemCount) {
      cartItemCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    }

    // Update cart badge in navigation (if exists)
    const navCartBadge = document.querySelector('.nav-cart-badge');
    if (navCartBadge) {
      navCartBadge.textContent = count;
      navCartBadge.style.display = count > 0 ? 'inline' : 'none';
    }
  }

  proceedToCheckout() {
    if (this.items.length === 0) {
      this.showNotification('Tu carrito está vacío', 'warning');
      return;
    }

    // Save cart data for checkout
    sessionStorage.setItem('checkout_data', JSON.stringify({
      items: this.items,
      subtotal: this.getTotal(),
      shipping: this.getShippingCost(),
      total: this.getFinalTotal()
    }));

    // Redirect to checkout con ruta relativa
    const checkoutPath = '/checkout';
    if (window.location.pathname === checkoutPath) {
      window.location.reload();
      return;
    }
    window.location.href = checkoutPath;
  }

  showNotification(message, type = 'info') {
    // Usar el sistema de notificaciones global si está disponible
    if (window.showNotification && typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else if (window.cartOffcanvas && typeof window.cartOffcanvas.showNotification === 'function') {
      window.cartOffcanvas.showNotification(message, type);
    }
  }

  // Method to add item from product page
  addFromProduct(productId, quantity = 1) {
    // Fetch product details from API
    fetch(`/api/products/${productId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(product => {
        if (product && product.id) {
          this.addItem(product, quantity);
          this.showNotification(`${product.name} agregado al carrito`, 'success');
        } else {
          this.showNotification('Error al cargar el producto', 'danger');
        }
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        
        // Si falla la API, crear un producto básico con la información disponible
        const productCard = document.querySelector(`[onclick*="${productId}"]`)?.closest('.card, .product-card, .product-item');
        const productName = productCard?.querySelector('h5, h6, .product-name')?.textContent?.trim() || 'Producto';
        const productPriceElement = productCard?.querySelector('.price, .product-price, [class*="price"]');
        const productPriceText = productPriceElement?.textContent || '0';
        const productPrice = parseInt(productPriceText.replace(/[^\d]/g, '')) || 0;
        const productImage = productCard?.querySelector('img')?.src || '/uploads/products/default.jpg';
        
        const fallbackProduct = {
          id: productId,
          name: productName,
          price: productPrice,
          imageUrl: productImage,
          stock: 999
        };
        
        this.addItem(fallbackProduct, quantity);
        this.showNotification(`${fallbackProduct.name} agregado al carrito`, 'success');
      });
  }

  // Method to get cart summary for other pages
  getCartSummary() {
    return {
      items: this.items,
      itemCount: this.getItemCount(),
      subtotal: this.getTotal(),
      shipping: this.getShippingCost(),
      total: this.getFinalTotal()
    };
  }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.cart = new ShoppingCart();
  
  // Update cart badge in navigation
  const cartLink = document.querySelector('a[href="/cart"]');
  if (cartLink && !cartLink.querySelector('.nav-cart-badge')) {
    const badge = document.createElement('span');
    badge.className = 'nav-cart-badge badge bg-primary ms-1';
    badge.style.display = 'none';
    cartLink.appendChild(badge);
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShoppingCart;
}
