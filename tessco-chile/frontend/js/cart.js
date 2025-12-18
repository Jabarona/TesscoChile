// Carrito de Compras - Tessco Chile
class ShoppingCart {
  constructor() {
    this.items = this.loadFromStorage();
    this.shippingCost = 5000; // CLP
    this.freeShippingMin = 50000; // CLP
    this.init();
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
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity,
        stock: product.stock || 999
      });
    }
    
    this.saveToStorage();
    this.updateCartUI();
    this.updateCartBadge();
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveToStorage();
    this.updateCartUI();
    this.updateCartBadge();
  }

  updateQuantity(productId, quantity) {
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
          <div class="col-md-2">
            <img src="${item.imageUrl || '/uploads/products/default.jpg'}" 
                 alt="${item.name}" 
                 class="product-image">
          </div>
          <div class="col-md-4">
            <h5 class="text-white mb-1">${item.name}</h5>
            <p class="text-muted mb-0">Precio unitario: $${item.price.toLocaleString()}</p>
          </div>
          <div class="col-md-3">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" 
                     class="quantity-input" 
                     value="${item.quantity}" 
                     min="1" 
                     max="${item.stock}"
                     onchange="cart.updateQuantity('${item.id}', parseInt(this.value))">
              <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          <div class="col-md-2">
            <h6 class="text-primary mb-0">$${(item.price * item.quantity).toLocaleString()}</h6>
          </div>
          <div class="col-md-1">
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
      subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
    }

    if (shippingElement) {
      if (shipping === 0) {
        shippingElement.innerHTML = '<span class="text-success">¡Envío gratis!</span>';
      } else {
        shippingElement.textContent = `$${shipping.toLocaleString()}`;
      }
    }

    if (totalElement) {
      totalElement.textContent = `$${total.toLocaleString()}`;
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

    // Redirect to checkout
    window.location.href = '/checkout';
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
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
        const productName = document.querySelector(`[data-product-id="${productId}"] h5`)?.textContent || 'Producto';
        const productPrice = document.querySelector(`[data-product-id="${productId}"] .price`)?.textContent || '0';
        const productImage = document.querySelector(`[data-product-id="${productId}"] img`)?.src || '/uploads/products/default.jpg';
        
        const fallbackProduct = {
          id: productId,
          name: productName,
          price: parseInt(productPrice.replace(/[^\d]/g, '')) || 0,
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
