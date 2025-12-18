// Funcionalidad específica de la página de tienda
class ShopManager {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.currentSort = 'name';
    this.activeNavCategory = 'all';
    this.allProductsSelected = false;
    
    this.init();
  }
  
  init() {
    this.loadProducts();
    this.setupEventListeners();
    this.renderProducts();
  }
  
  loadProducts() {
    // Productos de ejemplo - en producción vendrían de la API
    this.products = [
      {
        id: 1,
        name: "MacBook Pro 14\" M3",
        price: 1899990,
        category: "notebooks",
        brand: "apple",
        image: "images/product-thumbnail-1.jpg",
        description: "Notebook profesional con chip M3",
        inStock: true,
        rating: 4.8
      },
      {
        id: 2,
        name: "Samsung Galaxy S24 Ultra",
        price: 1299990,
        category: "smartphones",
        brand: "samsung",
        image: "images/product-thumbnail-2.jpg",
        description: "Smartphone premium con cámara de 200MP",
        inStock: true,
        rating: 4.9
      },
      {
        id: 3,
        name: "HP Pavilion 15",
        price: 699990,
        category: "notebooks",
        brand: "hp",
        image: "images/product-thumbnail-3.jpg",
        description: "Notebook para estudiantes y trabajo",
        inStock: true,
        rating: 4.5
      },
      {
        id: 4,
        name: "iPhone 15 Pro",
        price: 1199990,
        category: "smartphones",
        brand: "apple",
        image: "images/product-thumbnail-4.jpg",
        description: "El iPhone más avanzado",
        inStock: true,
        rating: 4.7
      },
      {
        id: 5,
        name: "Monitor Samsung 27\" 4K",
        price: 399990,
        category: "monitores",
        brand: "samsung",
        image: "images/product-thumbnail-5.jpg",
        description: "Monitor 4K para profesionales",
        inStock: true,
        rating: 4.6
      },
      {
        id: 6,
        name: "ASUS ROG Strix G15",
        price: 1599990,
        category: "notebooks",
        brand: "asus",
        image: "images/product-thumbnail-6.jpg",
        description: "Notebook gaming de alto rendimiento",
        inStock: true,
        rating: 4.8
      },
      {
        id: 7,
        name: "AirPods Pro 2",
        price: 249990,
        category: "accesorios",
        brand: "apple",
        image: "images/product-thumbnail-7.jpg",
        description: "Audífonos inalámbricos con cancelación de ruido",
        inStock: true,
        rating: 4.9
      },
      {
        id: 8,
        name: "Monitor LG UltraWide 34\"",
        price: 599990,
        category: "monitores",
        brand: "lg",
        image: "images/product-thumbnail-8.jpg",
        description: "Monitor ultrawide para productividad",
        inStock: true,
        rating: 4.7
      },
      {
        id: 9,
        name: "Samsung Galaxy Buds Pro",
        price: 199990,
        category: "accesorios",
        brand: "samsung",
        image: "images/product-small-1.jpg",
        description: "Audífonos inalámbricos premium",
        inStock: true,
        rating: 4.6
      },
      {
        id: 10,
        name: "Dell XPS 13",
        price: 1299990,
        category: "notebooks",
        brand: "dell",
        image: "images/product-small-2.jpg",
        description: "Notebook ultrabook premium",
        inStock: true,
        rating: 4.8
      },
      {
        id: 11,
        name: "OnePlus 11",
        price: 799990,
        category: "smartphones",
        brand: "oneplus",
        image: "images/product-small-3.jpg",
        description: "Smartphone con carga rápida",
        inStock: true,
        rating: 4.5
      },
      {
        id: 12,
        name: "Teclado Mecánico Logitech",
        price: 89990,
        category: "accesorios",
        brand: "logitech",
        image: "images/product-small-4.jpg",
        description: "Teclado mecánico para gaming",
        inStock: true,
        rating: 4.4
      }
    ];
    
    this.filteredProducts = [...this.products];
  }
  
  setupEventListeners() {
    // Filtros
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.sortProducts();
      this.renderProducts();
    });
    
    // Botones de filtro
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.applyFilters();
      });
    });
    
    // Filtros de precio
    document.getElementById('price-min').addEventListener('input', () => {
      this.applyFilters();
    });
    
    document.getElementById('price-max').addEventListener('input', () => {
      this.applyFilters();
    });

    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';
        this.allProductsSelected = false;
        this.activeNavCategory = 'all';
        this.applyFilters();
      });
    }

    this.setupCategoryNav();
  }
  
  applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('input[type="checkbox"][id^="cat-"]:checked'))
      .map(cb => cb.value);
    
    const selectedBrands = Array.from(document.querySelectorAll('input[type="checkbox"][id^="brand-"]:checked'))
      .map(cb => cb.value);
    
    const minPrice = parseInt(document.getElementById('price-min').value) || 0;
    const maxPrice = parseInt(document.getElementById('price-max').value) || Infinity;
    
    this.filteredProducts = this.products.filter(product => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const priceMatch = product.price >= minPrice && product.price <= maxPrice;
      
      return categoryMatch && brandMatch && priceMatch;
    });

    if (selectedCategories.length === 0) {
      if (this.activeNavCategory !== 'all-products') {
        this.activeNavCategory = 'all';
      }
    } else if (selectedCategories.length === 1) {
      this.activeNavCategory = selectedCategories[0];
      this.allProductsSelected = false;
    } else {
      this.activeNavCategory = 'filters';
      this.allProductsSelected = false;
    }

    this.highlightCategoryLink(this.activeNavCategory);
    
    this.currentPage = 1;
    this.renderProducts();
  }
  
  sortProducts() {
    switch (this.currentSort) {
      case 'name':
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => b.id - a.id);
        break;
    }
  }
  
  renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);
    
    grid.innerHTML = '';
    
    if (productsToShow.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <h5 class="text-white">No se encontraron productos</h5>
          <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
        </div>
      `;
      return;
    }
    
    productsToShow.forEach(product => {
      const productCard = this.createProductCard(product);
      grid.appendChild(productCard);
    });
    
    this.updatePagination();
  }
  
  createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';
    
    col.innerHTML = `
      <div class="product-item hover-effect-slide">
        <div class="image-holder position-relative">
          <a href="single-product.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-image img-fluid">
          </a>
          <button class="btn btn-primary w-100 mt-2 rounded-1 add-to-cart-btn" data-product='${JSON.stringify(product)}'>
            Agregar al Carrito
          </button>
        </div>
        <div class="product-content d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 class="fs-5 mt-3">
            <a href="single-product.html?id=${product.id}" class="text-white">${product.name}</a>
          </h5>
          <div class="text-end">
            <span class="text-primary fw-bold">${formatPrice(product.price)}</span>
            <div class="rating mt-1">
              ${this.renderStars(product.rating)}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Agregar event listener al botón
    const addToCartBtn = col.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const productData = JSON.parse(e.target.getAttribute('data-product'));
      cart.addItem(productData);
      showNotification(`${productData.name} agregado al carrito`, 'success');
    });
    
    return col;
  }

  setupCategoryNav() {
    const navLinks = document.querySelectorAll('.store-category-link');
    if (!navLinks.length) return;

    this.highlightCategoryLink(this.activeNavCategory);

    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const category = link.dataset.category;
        this.handleCategoryNavClick(category);
      });
    });
  }

  handleCategoryNavClick(category) {
    if (category === 'filters') {
      this.activeNavCategory = 'filters';
      this.allProductsSelected = false;
      this.highlightCategoryLink('filters');
      document.querySelectorAll('.filter-dropdown').forEach(detail => detail.open = true);
      const sidebar = document.querySelector('.filters-sidebar');
      if (sidebar) {
        sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const categoryCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="cat-"]');

    if (category === 'all' || category === 'all-products') {
      categoryCheckboxes.forEach(cb => {
        cb.checked = false;
      });
      this.allProductsSelected = category === 'all-products';
    } else {
      categoryCheckboxes.forEach(cb => {
        cb.checked = cb.value === category;
      });
      this.allProductsSelected = false;
    }

    this.activeNavCategory = category;
    this.highlightCategoryLink(this.activeNavCategory);
    this.applyFilters();
  }

  highlightCategoryLink(activeCategory) {
    const navLinks = document.querySelectorAll('.store-category-link');
    if (!navLinks.length) return;

    navLinks.forEach(link => {
      const linkCategory = link.dataset.category;
      let shouldActivate = false;

      if (activeCategory === 'all-products') {
        shouldActivate = linkCategory === 'all-products';
      } else if (activeCategory === 'filters') {
        shouldActivate = linkCategory === 'filters';
      } else if (activeCategory === 'all') {
        shouldActivate = linkCategory === 'all';
      } else {
        shouldActivate = linkCategory === activeCategory;
      }

      link.classList.toggle('active', shouldActivate);
    });
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
  
  updatePagination() {
    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    const pagination = document.querySelector('.pagination');
    
    if (!pagination) return;
    
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
      <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="shopManager.previousPage()">Anterior</a>
      </li>
    `;
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <li class="page-item ${i === this.currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="shopManager.goToPage(${i})">${i}</a>
        </li>
      `;
    }
    
    // Botón siguiente
    paginationHTML += `
      <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="shopManager.nextPage()">Siguiente</a>
      </li>
    `;
    
    pagination.innerHTML = paginationHTML;
  }
  
  goToPage(page) {
    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderProducts();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderProducts();
    }
  }
  
  nextPage() {
    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderProducts();
    }
  }
}

// Función global para aplicar filtros (llamada desde el botón)
function applyFilters() {
  if (window.shopManager) {
    shopManager.applyFilters();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  window.shopManager = new ShopManager();
});
