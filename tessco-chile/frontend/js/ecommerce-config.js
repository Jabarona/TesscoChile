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

// Funciones del carrito
class ShoppingCart {
  constructor() {
    this.items = this.loadFromStorage();
    this.updateCartUI();
  }
  
  loadFromStorage() {
    const stored = localStorage.getItem(ECOMMERCE_CONFIG.cart.storageKey);
    return stored ? JSON.parse(stored) : [];
  }
  
  saveToStorage() {
    localStorage.setItem(ECOMMERCE_CONFIG.cart.storageKey, JSON.stringify(this.items));
  }
  
  addItem(product) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    this.saveToStorage();
    this.updateCartUI();
  }
  
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveToStorage();
    this.updateCartUI();
  }
  
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        this.removeItem(productId);
      } else {
        this.saveToStorage();
        this.updateCartUI();
      }
    }
  }
  
  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  
  getItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }
  
  updateCartUI() {
    // Actualizar contador del carrito
    const cartBadge = document.querySelector('.badge.bg-primary.rounded-pill');
    if (cartBadge) {
      cartBadge.textContent = this.getItemCount();
    }
    
    // Actualizar lista de productos en el carrito
    this.updateCartList();
  }
  
  updateCartList() {
    const cartList = document.querySelector('.list-group');
    if (!cartList) return;
    
    cartList.innerHTML = '';
    
    this.items.forEach(item => {
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item d-flex justify-content-between lh-sm';
      listItem.innerHTML = `
        <div>
          <h6 class="my-0">${item.name}</h6>
          <small class="text-body-secondary">Cantidad: ${item.quantity}</small>
        </div>
        <span class="text-body-secondary">${ECOMMERCE_CONFIG.products.currencySymbol}${item.price.toLocaleString()}</span>
      `;
      cartList.appendChild(listItem);
    });
    
    // Agregar total
    const totalItem = document.createElement('li');
    totalItem.className = 'list-group-item d-flex justify-content-between';
    totalItem.innerHTML = `
      <span>Total (${ECOMMERCE_CONFIG.products.currency})</span>
      <strong>${ECOMMERCE_CONFIG.products.currencySymbol}${this.getTotal().toLocaleString()}</strong>
    `;
    cartList.appendChild(totalItem);
  }
  
  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateCartUI();
  }
}

// Inicializar el carrito
const cart = new ShoppingCart();

// Funciones de utilidad
function formatPrice(price) {
  return `${ECOMMERCE_CONFIG.products.currencySymbol}${price.toLocaleString()}`;
}

function showNotification(message, type = 'success') {
  // Crear notificación simple
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Event listeners para botones de agregar al carrito
document.addEventListener('DOMContentLoaded', function() {
  // Agregar event listeners a todos los botones de "Agregar al Carrito"
  document.querySelectorAll('.btn-primary').forEach(button => {
    if (button.textContent.includes('Agregar al Carrito')) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Obtener información del producto desde el DOM
        const productCard = this.closest('.product-item');
        const productName = productCard.querySelector('h5 a').textContent;
        const productPrice = productCard.querySelector('span').textContent.replace(/[^\d]/g, '');
        
        const product = {
          id: Date.now(), // ID temporal
          name: productName,
          price: parseInt(productPrice),
          image: productCard.querySelector('img').src
        };
        
        cart.addItem(product);
        showNotification(`${productName} agregado al carrito`, 'success');
      });
    }
  });
});

// Exportar para uso global
window.cart = cart;
window.ECOMMERCE_CONFIG = ECOMMERCE_CONFIG;
