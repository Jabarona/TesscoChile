// Funcionalidad específica de la página de producto individual
class SingleProductManager {
  constructor() {
    this.product = null;
    this.quantity = 1;
    this.init();
  }
  
  init() {
    this.loadProduct();
    this.setupEventListeners();
  }
  
  loadProduct() {
    // Obtener ID del producto desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
      this.showError('Producto no encontrado');
      return;
    }
    
    // Buscar el producto en la lista (en producción vendría de la API)
    const products = this.getProducts();
    this.product = products.find(p => p.id == productId);
    
    if (!this.product) {
      this.showError('Producto no encontrado');
      return;
    }
    
    this.renderProduct();
    this.loadRelatedProducts();
  }
  
  getProducts() {
    // Lista de productos (en producción vendría de la API)
    return [
      {
        id: 1,
        name: "MacBook Pro 14\" M3",
        price: 1899990,
        category: "notebooks",
        brand: "apple",
        image: "images/product-thumbnail-1.jpg",
        images: [
          "images/product-thumbnail-1.jpg",
          "images/product-thumbnail-2.jpg",
          "images/product-thumbnail-3.jpg"
        ],
        description: "Notebook profesional con chip M3",
        fullDescription: "El MacBook Pro de 14 pulgadas con chip M3 ofrece un rendimiento excepcional para profesionales creativos. Con una pantalla Liquid Retina XDR de 14.2 pulgadas, hasta 22 horas de duración de batería y un sistema de audio de seis altavoces.",
        specifications: {
          "Procesador": "Apple M3",
          "Memoria RAM": "16GB",
          "Almacenamiento": "512GB SSD",
          "Pantalla": "14.2\" Liquid Retina XDR",
          "Resolución": "3024 x 1964",
          "Batería": "Hasta 22 horas",
          "Peso": "1.6 kg",
          "Sistema Operativo": "macOS Sonoma"
        },
        inStock: true,
        stock: 5,
        rating: 4.8,
        reviews: 124
      },
      {
        id: 2,
        name: "Samsung Galaxy S24 Ultra",
        price: 1299990,
        category: "smartphones",
        brand: "samsung",
        image: "images/product-thumbnail-2.jpg",
        images: [
          "images/product-thumbnail-2.jpg",
          "images/product-thumbnail-1.jpg",
          "images/product-thumbnail-3.jpg"
        ],
        description: "Smartphone premium con cámara de 200MP",
        fullDescription: "El Samsung Galaxy S24 Ultra redefine la experiencia smartphone con su cámara de 200MP, procesador Snapdragon 8 Gen 3 y pantalla Dynamic AMOLED 2X de 6.8 pulgadas. Diseñado para profesionales y entusiastas de la fotografía.",
        specifications: {
          "Procesador": "Snapdragon 8 Gen 3",
          "Memoria RAM": "12GB",
          "Almacenamiento": "256GB",
          "Pantalla": "6.8\" Dynamic AMOLED 2X",
          "Resolución": "3120 x 1440",
          "Cámara Principal": "200MP",
          "Batería": "5000mAh",
          "Peso": "232g",
          "Sistema Operativo": "Android 14"
        },
        inStock: true,
        stock: 8,
        rating: 4.9,
        reviews: 89
      },
      {
        id: 3,
        name: "HP Pavilion 15",
        price: 699990,
        category: "notebooks",
        brand: "hp",
        image: "images/product-thumbnail-3.jpg",
        images: [
          "images/product-thumbnail-3.jpg",
          "images/product-thumbnail-1.jpg",
          "images/product-thumbnail-2.jpg"
        ],
        description: "Notebook para estudiantes y trabajo",
        fullDescription: "El HP Pavilion 15 combina rendimiento y portabilidad perfectamente. Ideal para estudiantes y profesionales que necesitan un equipo confiable para trabajo y entretenimiento. Con procesador Intel Core i5 y pantalla Full HD.",
        specifications: {
          "Procesador": "Intel Core i5-1235U",
          "Memoria RAM": "8GB DDR4",
          "Almacenamiento": "512GB SSD",
          "Pantalla": "15.6\" Full HD",
          "Resolución": "1920 x 1080",
          "Batería": "Hasta 8 horas",
          "Peso": "1.75 kg",
          "Sistema Operativo": "Windows 11"
        },
        inStock: true,
        stock: 12,
        rating: 4.5,
        reviews: 67
      }
    ];
  }
  
  renderProduct() {
    const container = document.getElementById('product-container');
    if (!container) return;
    
    // Actualizar breadcrumb
    const breadcrumb = document.getElementById('product-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = this.product.name;
    }
    
    // Actualizar título de la página
    document.title = `${this.product.name} - Tessco Chile`;
    
    container.innerHTML = `
      <div class="col-lg-6">
        <div class="product-gallery">
          <div class="main-image mb-3">
            <img src="${this.product.images[0]}" alt="${this.product.name}" class="img-fluid rounded" id="main-product-image">
          </div>
          <div class="thumbnail-images d-flex gap-2">
            ${this.product.images.map((img, index) => `
              <img src="${img}" alt="${this.product.name}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" onclick="singleProductManager.changeMainImage('${img}')">
            `).join('')}
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="product-info">
          <h1 class="text-white mb-3">${this.product.name}</h1>
          
          <div class="rating mb-3">
            ${this.renderStars(this.product.rating)}
            <span class="text-muted ms-2">${this.product.rating} (${this.product.reviews} reseñas)</span>
          </div>
          
          <div class="price mb-4">
            <h3 class="text-primary">${formatPrice(this.product.price)}</h3>
            <p class="text-muted">Precio incluye IVA</p>
          </div>
          
          <div class="description mb-4">
            <p class="text-white">${this.product.fullDescription}</p>
          </div>
          
          <div class="stock-info mb-4">
            ${this.product.inStock ? 
              `<span class="badge bg-success">En Stock (${this.product.stock} disponibles)</span>` : 
              `<span class="badge bg-danger">Agotado</span>`
            }
          </div>
          
          <div class="quantity-selector mb-4">
            <label class="form-label text-white">Cantidad:</label>
            <div class="input-group" style="width: 150px;">
              <button class="btn btn-outline-secondary" type="button" onclick="singleProductManager.decreaseQuantity()">
                <svg width="16" height="16" viewBox="0 0 24 24"><use xlink:href="#minus"></use></svg>
              </button>
              <input type="number" class="form-control text-center" value="${this.quantity}" min="1" max="${this.product.stock}" id="quantity-input">
              <button class="btn btn-outline-secondary" type="button" onclick="singleProductManager.increaseQuantity()">
                <svg width="16" height="16" viewBox="0 0 24 24"><use xlink:href="#plus"></use></svg>
              </button>
            </div>
          </div>
          
          <div class="action-buttons mb-4">
            <button class="btn btn-primary btn-lg me-3" onclick="singleProductManager.addToCart()" ${!this.product.inStock ? 'disabled' : ''}>
              Agregar al Carrito
            </button>
            <button class="btn btn-outline-light btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24"><use xlink:href="#heart"></use></svg>
              Favoritos
            </button>
          </div>
          
          <div class="product-features">
            <h6 class="text-white mb-3">Características Principales:</h6>
            <ul class="list-unstyled">
              ${Object.entries(this.product.specifications).slice(0, 4).map(([key, value]) => `
                <li class="mb-2">
                  <strong class="text-white">${key}:</strong> 
                  <span class="text-muted">${value}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    
    // Agregar sección de especificaciones detalladas
    this.renderSpecifications();
  }
  
  renderSpecifications() {
    const container = document.getElementById('product-container');
    if (!container) return;
    
    const specsSection = document.createElement('div');
    specsSection.className = 'col-12 mt-5';
    specsSection.innerHTML = `
      <div class="card bg-black border-0">
        <div class="card-body">
          <h5 class="text-white mb-4">Especificaciones Técnicas</h5>
          <div class="row">
            ${Object.entries(this.product.specifications).map(([key, value]) => `
              <div class="col-md-6 mb-3">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">${key}:</span>
                  <span class="text-white">${value}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(specsSection);
  }
  
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="text-warning">★</span>';
    }
    
    if (hasHalfStar) {
      stars += '<span class="text-warning">☆</span>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="text-muted">☆</span>';
    }
    
    return stars;
  }
  
  changeMainImage(imageSrc) {
    const mainImage = document.getElementById('main-product-image');
    if (mainImage) {
      mainImage.src = imageSrc;
    }
  }
  
  increaseQuantity() {
    if (this.quantity < this.product.stock) {
      this.quantity++;
      this.updateQuantityInput();
    }
  }
  
  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.updateQuantityInput();
    }
  }
  
  updateQuantityInput() {
    const input = document.getElementById('quantity-input');
    if (input) {
      input.value = this.quantity;
    }
  }
  
  addToCart() {
    if (!this.product.inStock) {
      showNotification('Este producto no está disponible', 'error');
      return;
    }
    
    const productToAdd = {
      ...this.product,
      quantity: this.quantity
    };
    
    cart.addItem(productToAdd);
    showNotification(`${this.product.name} agregado al carrito`, 'success');
  }
  
  loadRelatedProducts() {
    const container = document.getElementById('related-products');
    if (!container) return;
    
    // Obtener productos relacionados (misma categoría, excluyendo el actual)
    const relatedProducts = this.getProducts()
      .filter(p => p.category === this.product.category && p.id !== this.product.id)
      .slice(0, 4);
    
    container.innerHTML = relatedProducts.map(product => `
      <div class="col-md-3 mb-4">
        <div class="product-item hover-effect-slide">
          <div class="image-holder position-relative">
            <a href="single-product.html?id=${product.id}">
              <img src="${product.image}" alt="${product.name}" class="product-image img-fluid">
            </a>
            <button class="btn btn-primary w-100 mt-2 rounded-1" onclick="singleProductManager.addRelatedToCart(${product.id})">
              Agregar al Carrito
            </button>
          </div>
          <div class="product-content">
            <h6 class="mt-3">
              <a href="single-product.html?id=${product.id}" class="text-white">${product.name}</a>
            </h6>
            <div class="text-end">
              <span class="text-primary fw-bold">${formatPrice(product.price)}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  addRelatedToCart(productId) {
    const product = this.getProducts().find(p => p.id === productId);
    if (product) {
      cart.addItem(product);
      showNotification(`${product.name} agregado al carrito`, 'success');
    }
  }
  
  showError(message) {
    const container = document.getElementById('product-container');
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <h4 class="text-white mb-3">${message}</h4>
          <a href="shop.html" class="btn btn-primary">Volver a la Tienda</a>
        </div>
      `;
    }
  }
  
  setupEventListeners() {
    // Event listener para el input de cantidad
    document.addEventListener('input', (e) => {
      if (e.target.id === 'quantity-input') {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= this.product.stock) {
          this.quantity = value;
        } else {
          e.target.value = this.quantity;
        }
      }
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  window.singleProductManager = new SingleProductManager();
});
