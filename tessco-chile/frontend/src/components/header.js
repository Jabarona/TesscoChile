// header.js - Componente de header reutilizable para Tessco Chile

class HeaderComponent {
  constructor(options = {}) {
    this.options = {
      showCart: true,
      showWishlist: true,
      activeLink: '',
      ...options
    };
  }

  render() {
    return `
      <!-- SVG Icons -->
      <svg xmlns="http://www.w3.org/2000/svg" style="display: none;" id="header-svg-icons">
        <defs>
          <symbol xmlns="http://www.w3.org/2000/svg" id="instagram" viewBox="0 0 15 15">
            <path fill="none" stroke="currentColor"
              d="M11 3.5h1M4.5.5h6a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4Zm3 10a3 3 0 1 1 0-6a3 3 0 0 1 0 6Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="facebook" viewBox="0 0 15 15">
            <path fill="none" stroke="currentColor"
              d="M7.5 14.5a7 7 0 1 1 0-14a7 7 0 0 1 0 14Zm0 0v-8a2 2 0 0 1 2-2h.5m-5 4h5" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="twitter" viewBox="0 0 15 15">
            <path fill="currentColor"
              d="m14.478 1.5l.5-.033a.5.5 0 0 0-.871-.301l.371.334Zm-.498 2.959a.5.5 0 1 0-1 0h1Zm-6.49.082h-.5h.5Zm0 .959h.5h-.5Zm-6.99 7V12a.5.5 0 0 0-.278.916L.5 12.5Zm.998-11l.469-.175a.5.5 0 0 0-.916-.048l.447.223Zm3.994 9l.354.353a.5.5 0 0 0-.195-.827l-.159.474Zm7.224-8.027l-.37.336l.18.199l.265-.04l-.075-.495Zm1.264-.94c.051.778.003 1.25-.123 1.606c-.122.345-.336.629-.723 1l.692.722c.438-.42.776-.832.974-1.388c.193-.546.232-1.178.177-2.006l-.998.066Zm0 3.654V4.46h-1v.728h1Zm-6.99-.646V5.5h1v-.959h-1Zm0 .959V6h1v-.5h-1ZM10.525 1a3.539 3.539 0 0 0-3.537 3.541h1A2.539 2.539 0 0 1 10.526 2V1Zm2.454 4.187C12.98 9.503 9.487 13 5.18 13v1c4.86 0 8.8-3.946 8.8-8.813h-1ZM1.03 1.675C1.574 3.127 3.614 6 7.49 6V5C4.174 5 2.421 2.54 1.966 1.325l-.937.35Zm.021-.398C.004 3.373-.157 5.407.604 7.139c.759 1.727 2.392 3.055 4.73 3.835l.317-.948c-2.155-.72-3.518-1.892-4.132-3.29c-.612-1.393-.523-3.11.427-5.013l-.895-.446Zm4.087 8.87C4.536 10.75 2.726 12 .5 12v1c2.566 0 4.617-1.416 5.346-2.147l-.708-.706Zm7.949-8.009A3.445 3.445 0 0 0 10.526 1v1c.721 0 1.37.311 1.82.809l.74-.671Zm-.296.83a3.513 3.513 0 0 0 2.06-1.134l-.744-.668a2.514 2.514 0 0 1-1.466.813l.15.989ZM.222 12.916C1.863 14.01 3.583 14 5.18 14v-1c-1.63 0-3.048-.011-4.402-.916l-.556.832Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="pinterest" viewBox="0 0 15 15">
            <path fill="none" stroke="currentColor"
              d="m4.5 13.5l3-7m-3.236 3a2.989 2.989 0 0 1-.764-2V7A3.5 3.5 0 0 1 7 3.5h1A3.5 3.5 0 0 1 11.5 7v.5a3 3 0 0 1-3 3a2.081 2.081 0 0 1-1.974-1.423L6.5 9m1 5.5a7 7 0 1 1 0-14a7 7 0 0 1 0 14Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="youtube" viewBox="0 0 15 15">
            <path fill="currentColor"
              d="m1.61 12.738l-.104.489l.105-.489Zm11.78 0l.104.489l-.105-.489Zm0-10.476l.104-.489l-.105.489Zm-11.78 0l.106.489l-.105-.489ZM6.5 5.5l.277-.416A.5.5 0 0 0 6 5.5h.5Zm0 4H6a.5.5 0 0 0 .777.416L6.5 9.5Zm3-2l.277.416a.5.5 0 0 0 0-.832L9.5 7.5ZM0 3.636v7.728h1V3.636H0Zm15 7.728V3.636h-1v7.728h1ZM1.506 13.227c3.951.847 8.037.847 11.988 0l-.21-.978a27.605 27.605 0 0 1-11.568 0l-.21.978ZM13.494 1.773a28.606 28.606 0 0 0-11.988 0l.21.978a27.607 27.607 0 0 1 11.568 0l.21-.978ZM15 3.636c0-.898-.628-1.675-1.506-1.863l-.21.978c.418.09.716.458.716.885h1Zm-1 7.728a.905.905 0 0 1-.716.885l.21.978A1.905 1.905 0 0 0 15 11.364h-1Zm-14 0c0 .898.628 1.675 1.506 1.863l.21-.978A.905.905 0 0 1 1 11.364H0Zm1-7.728c0-.427.298-.796.716-.885l-.21-.978A1.905 1.905 0 0 0 0 3.636h1ZM6 5.5v4h1v-4H6Zm.777 4.416l3-2l-.554-.832l-3 2l.554.832Zm3-2.832l-3-2l-.554.832l3 2l.554-.832Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="dribble" viewBox="0 0 15 15">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
              d="M4.839 1.024c3.346 4.041 5.096 7.922 5.704 12.782M.533 6.82c5.985-.138 9.402-1.083 11.97-4.216M2.7 12.594c3.221-4.902 7.171-5.65 11.755-4.293M14.5 7.5a7 7 0 1 0-14 0a7 7 0 0 0 14 0Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="cart" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M8.5 19a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8.5 19ZM19 16H7a1 1 0 0 1 0-2h8.491a3.013 3.013 0 0 0 2.885-2.176l1.585-5.55A1 1 0 0 0 19 5H6.74a3.007 3.007 0 0 0-2.82-2H3a1 1 0 0 0 0 2h.921a1.005 1.005 0 0 1 .962.725l.155.545v.005l1.641 5.742A3 3 0 0 0 7 18h12a1 1 0 0 0 0-2Zm-1.326-9l-1.22 4.274a1.005 1.005 0 0 1-.963.726H8.754l-.255-.892L7.326 7ZM16.5 19a1.5 1.5 0 1 0 1.5 1.5a1.5 1.5 0 0 0-1.5-1.5Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="search" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 7-7a7 7 0 0 1-7 7Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="user" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M15.71 12.71a6 6 0 1 0-7.42 0a10 10 0 0 0-6.22 8.18a1 1 0 0 0 2 .22a8 8 0 0 1 15.9 0a1 1 0 0 0 1 .89h.11a1 1 0 0 0 .88-1.1a10 10 0 0 0-6.25-8.19ZM12 12a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" />
          </symbol>
          <symbol xmlns="http://www.w3.org/2000/svg" id="heart" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M20.16 4.61A6.27 6.27 0 0 0 12 4a6.27 6.27 0 0 0-8.16 9.48l7.45 7.45a1 1 0 0 0 1.42 0l7.45-7.45a6.27 6.27 0 0 0 0-8.87Zm-1.41 7.46L12 18.81l-6.75-6.74a4.28 4.28 0 0 1 3-7.3a4.25 4.25 0 0 1 3 1.25a1 1 0 0 0 1.42 0a4.27 4.27 0 0 1 6 6.05Z" />
          </symbol>
        </defs>
      </svg>

      <!-- Preloader -->
      <div class="preloader text-white fs-6 text-uppercase overflow-hidden"></div>

      <!-- Cart Offcanvas -->
      <div class="offcanvas offcanvas-end cart-offcanvas" data-bs-scroll="true" tabindex="-1" id="offcanvasCart" aria-labelledby="offcanvasCartLabel">
        <div class="offcanvas-header border-bottom">
          <h5 class="offcanvas-title text-white" id="offcanvasCartLabel">
            <i class="fas fa-shopping-cart me-2 text-primary"></i>Mi Carrito
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body p-0">
          <!-- Empty Cart State -->
          <div id="empty-cart-offcanvas" class="text-center py-5 px-3">
            <div class="mb-4">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 19a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8.5 19ZM19 16H7a1 1 0 0 1 0-2h8.491a3.013 3.013 0 0 0 2.885-2.176l1.585-5.55A1 1 0 0 0 19 5H6.74a3.007 3.007 0 0 0-2.82-2H3a1 1 0 0 0 0 2h.921a1.005 1.005 0 0 1 .962.725l.155.545v.005l1.641 5.742A3 3 0 0 0 7 18h12a1 1 0 0 0 0-2Zm-1.326-9l-1.22 4.274a1.005 1.005 0 0 1-.963.726H8.754l-.255-.892L7.326 7ZM16.5 19a1.5 1.5 0 1 0 1.5 1.5a1.5 1.5 0 0 0-1.5-1.5Z" fill="#6c757d"/>
              </svg>
            </div>
            <h6 class="text-white mb-2">Tu carrito está vacío</h6>
            <p class="text-muted small mb-4">¡Agrega productos y comienza a comprar!</p>
            <button class="btn btn-primary" data-bs-dismiss="offcanvas" onclick="window.location.href='/shop'">
              <i class="fas fa-store me-2"></i>Ir a la Tienda
            </button>
          </div>

          <!-- Cart Items -->
          <div id="cart-items-container">
            <div class="cart-items-list p-3" id="offcanvas-cart-items" style="max-height: calc(100vh - 280px); overflow-y: auto;">
              <!-- Items se cargarán dinámicamente -->
            </div>

            <!-- Cart Summary -->
            <div class="cart-summary border-top mt-auto">
              <div class="p-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Subtotal:</span>
                  <span class="text-white" id="offcanvas-subtotal">$0</span>
                </div>
                <div class="d-flex justify-content-between mb-3">
                  <span class="text-muted">Envío:</span>
                  <span class="text-white" id="offcanvas-shipping">$0</span>
                </div>
                <div class="d-flex justify-content-between mb-3 pb-3 border-bottom">
                  <span class="fw-bold text-white">Total:</span>
                  <span class="fw-bold text-primary fs-5" id="offcanvas-total">$0</span>
                </div>
                <button class="btn btn-primary w-100 mb-2" onclick="window.location.href='/cart'">
                  <i class="fas fa-shopping-cart me-2"></i>Ver Carrito Completo
                </button>
                <button class="btn btn-outline-light w-100" data-bs-dismiss="offcanvas">
                  <i class="fas fa-arrow-left me-2"></i>Seguir Comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="navbar navbar-expand-lg text-white text-uppercase fs-7 ls-1 py-5 align-items-center">
        <div class="container-fluid">
          <div class="row align-items-center w-100 g-2">
            <div class="col-auto col-md-3 d-flex align-items-center">
              <a class="navbar-brand me-2" href="/">
                <img src="../../assets/images/logo.svg" data-default-src="../../assets/images/logo.svg" data-logo-static="true" width="204" height="46" alt="Tessco Chile">
              </a>
              <button class="navbar-toggler d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar"
                    aria-controls="offcanvasNavbar">
                    <span class="navbar-toggler-icon"></span>
              </button>
            </div>
            <div class="col-2 col-md-6 d-md-flex justify-content-center d-none">
              <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
                <div class="offcanvas-header">
                  <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Menú</h5>
                  <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>

                <div class="offcanvas-body">
                  <ul class="navbar-nav justify-content-end flex-grow-1 gap-1 gap-md-5 pe-3">
                    <li class="nav-item">
                      <a class="nav-link ${this.options.activeLink === 'inicio' ? 'active' : ''}" href="/home">Inicio</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link ${this.options.activeLink === 'tienda' ? 'active' : ''}" href="/shop">Tienda</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link ${this.options.activeLink === 'contacto' ? 'active' : ''}" href="/contact">Contacto</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="col-auto col-md-3 text-md-end ms-auto">
              <ul class="list-unstyled d-flex justify-content-end align-items-center m-0">
                ${this.options.showWishlist ? `
                <li>
                  <a href="/wishlist" class="nav-icon-link" title="Lista de deseos">
                    <svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#heart"></use></svg>
                  </a>
                </li>
                ` : ''}
                ${this.options.showCart ? `
                <li>
                  <a href="#" class="nav-icon-link position-relative" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCart" title="Carrito">
                    <svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#cart"></use></svg>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary nav-cart-badge" style="display: none; font-size: 0.7rem;">0</span>
                  </a>
                </li>
                ` : ''}
                <li class="ms-1" id="accountDropdownWrapper" style="position: relative;">
                  <button class="btn btn-outline-light rounded-pill account-button" id="accountButton" type="button" data-bs-toggle="offcanvas" data-bs-target="#accountOffcanvas" aria-controls="accountOffcanvas">
                    <svg class="account-icon" width="16" height="16" viewBox="0 0 24 24" style="display: none;">
                      <use xlink:href="#user"></use>
                    </svg>
                    <span class="account-text">Mi Cuenta</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <!-- Offcanvas para cuenta de usuario en móvil -->
      <div class="offcanvas offcanvas-end account-offcanvas" tabindex="-1" id="accountOffcanvas" aria-labelledby="accountOffcanvasLabel">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="accountOffcanvasLabel">
            <i class="fas fa-user"></i>
            Mi Cuenta
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <div class="d-flex flex-column gap-3">
            <a href="/login" class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 account-action-btn">
              <i class="fas fa-sign-in-alt"></i>
              <span>Iniciar Sesión</span>
            </a>
            <a href="/register" class="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 account-action-btn">
              <i class="fas fa-user-plus"></i>
              <span>Crear Cuenta</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Método para inyectar el header en el DOM
  inject(targetElement) {
    if (typeof targetElement === 'string') {
      targetElement = document.querySelector(targetElement);
    }
    
    if (targetElement) {
      // Limpiar completamente el contenido anterior
      targetElement.innerHTML = '';
      
      // Remover SVGs duplicados si existen
      const existingSVG = document.getElementById('header-svg-icons');
      if (existingSVG && existingSVG.parentNode !== targetElement) {
        existingSVG.remove();
        console.log('🗑️ SVG duplicado removido');
      }
      
      // Remover offcanvas duplicados si existen
      const existingOffcanvas = document.getElementById('offcanvasCart');
      if (existingOffcanvas && !targetElement.contains(existingOffcanvas)) {
        existingOffcanvas.remove();
        console.log('🗑️ Offcanvas duplicado removido');
      }
      
      // Remover navbars huérfanos
      const allNavbars = document.querySelectorAll('nav.navbar');
      allNavbars.forEach(nav => {
        if (!targetElement.contains(nav)) {
          nav.remove();
          console.log('🗑️ Navbar duplicado removido');
        }
      });

      // Asegurar estilos para los íconos del header
      if (!document.getElementById('header-nav-icon-styles')) {
        const style = document.createElement('style');
        style.id = 'header-nav-icon-styles';
        style.textContent = `
          .nav-icon-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 32px;
            transition: transform 0.2s ease;
          }

          .nav-icon-link svg {
            display: block;
            transition: transform 0.2s ease;
          }

          .nav-icon-link:hover svg {
            transform: none;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Insertar el nuevo header
      targetElement.innerHTML = this.render();
      console.log('📝 Header renderizado en #header');
      
      // Ajustar posicionamiento del dropdown en móvil después de renderizar
      setTimeout(() => {
        this.setupDropdownPositioning();
      }, 100);
      
      // Disparar evento cuando el header esté listo
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('header:loaded'));
        console.log('✅ Header cargado y evento disparado');
      }, 50);
    } else {
      console.error('Header: Target element not found');
    }
  }

  // Configurar el offcanvas de cuenta (ya no se usa dropdown)
  setupDropdownPositioning() {
    // Ya no necesitamos configuración especial, Bootstrap maneja el offcanvas automáticamente
    // Solo asegurémonos de que el offcanvas funcione correctamente
    const accountOffcanvas = document.getElementById('accountOffcanvas');
    if (accountOffcanvas) {
      // Cerrar offcanvas de cuenta cuando se abre el offcanvas de categorías
      const categoriesOffcanvas = document.getElementById('categoriesOffcanvas');
      if (categoriesOffcanvas) {
        categoriesOffcanvas.addEventListener('show.bs.offcanvas', () => {
          const offcanvasInstance = bootstrap.Offcanvas.getInstance(accountOffcanvas);
          if (offcanvasInstance && accountOffcanvas.classList.contains('show')) {
            offcanvasInstance.hide();
          }
        });
      }
    }
  }
}

// Función helper para cargar el header
function loadHeader(options = {}) {
  // Prevenir carga duplicada
  if (window.__headerLoaded) {
    console.warn('⚠️ Header ya fue cargado, evitando duplicación');
    return;
  }
  
  const header = new HeaderComponent(options);
  
  // Buscar el elemento donde se debe inyectar el header
  const headerContainer = document.getElementById('header');
  
  if (headerContainer) {
    // Limpiar contenido previo si existe
    headerContainer.innerHTML = '';
    header.inject(headerContainer);
    window.__headerLoaded = true;
    console.log('✅ Header cargado correctamente en #header');
  } else {
    // Si no existe el contenedor, insertar al inicio del body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = header.render();
    document.body.insertBefore(tempDiv.firstElementChild, document.body.firstChild);
    window.__headerLoaded = true;
    console.log('✅ Header cargado correctamente en body');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.HeaderComponent = HeaderComponent;
  window.loadHeader = loadHeader;
}

