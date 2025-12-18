// Componente de Footer Reutilizable
class FooterComponent {
  constructor() {
    this.footerHTML = `
      <footer id="footer" class="bg-dark">
        <div class="container-fluid">
          <div class="row d-flex flex-wrap justify-content-between my-5 py-5">
            <div class="col-md-4 col-sm-6 mb-4">
              <div class="footer-menu">
                <div class="footer-intro mb-4">
                  <a href="/" class="text-decoration-none">
                    <h3 class="text-white mb-0">Tessco Chile</h3>
                  </a>
                </div>
                <p class="text-muted">En Tessco Chile nos especializamos en ofrecer la mejor tecnología y accesorios para satisfacer todas tus necesidades digitales. Calidad, garantía y servicio al cliente de excelencia.</p>
                <div class="social-links">
                  <ul class="list-unstyled d-flex flex-wrap gap-3">
                    <li>
                      <a href="#" class="text-muted">
                        <i class="fab fa-facebook-f"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" class="text-muted">
                        <i class="fab fa-twitter"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" class="text-muted">
                        <i class="fab fa-youtube"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" class="text-muted">
                        <i class="fab fa-instagram"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="col-md-2 col-sm-6 mb-4">
              <div class="footer-menu">
                <h6 class="text-white mb-3">Enlaces</h6>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <a href="/" class="text-muted text-decoration-none">Inicio</a>
                  </li>
                  <li class="mb-2">
                    <a href="/shop" class="text-muted text-decoration-none">Tienda</a>
                  </li>
                  <li class="mb-2">
                    <a href="/login" class="text-muted text-decoration-none">Iniciar Sesión</a>
                  </li>
                  <li class="mb-2">
                    <a href="/register" class="text-muted text-decoration-none">Registrarse</a>
                  </li>
                  <li class="mb-2">
                    <a href="/contact" class="text-muted text-decoration-none">Contacto</a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
              <div class="footer-menu">
                <h6 class="text-white mb-3">Newsletter</h6>
                <p class="text-muted small">Suscríbete para recibir las mejores ofertas</p>
                <div class="input-group">
                  <input type="email" class="form-control" placeholder="Tu email" aria-label="Email">
                  <button class="btn btn-primary" type="button">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
              <div class="footer-menu">
                <h6 class="text-white mb-3">Contacto</h6>
                <p class="text-muted small mb-2">
                  <i class="fas fa-envelope me-2"></i>
                  contacto@tesscochile.cl
                </p>
                <p class="text-muted small mb-2">
                  <i class="fas fa-phone me-2"></i>
                  +56 9 1234 5678
                </p>
                <p class="text-muted small">
                  <i class="fas fa-map-marker-alt me-2"></i>
                  Santiago, Chile
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="border-top py-4">
          <div class="container-fluid">
            <div class="row align-items-center">
              <div class="col-md-6">
                <p class="text-muted small mb-0">© Copyright 2024 Tessco Chile. Todos los derechos reservados.</p>
              </div>
              <div class="col-md-6 text-md-end">
                <div class="d-flex justify-content-md-end gap-3 align-items-center">
                  <span class="text-muted small">Enviamos con:</span>
                  <div class="d-flex align-items-center footer-badge rounded px-2 py-1">
                    <i class="fab fa-shopify text-primary me-1"></i>
                    <span class="text-dark small fw-bold">Mercado Libre</span>
                  </div>
                  <span class="text-muted small ms-3">Pago seguro:</span>
                  <div class="d-flex align-items-center footer-badge rounded px-2 py-1">
                    <i class="fas fa-credit-card text-primary me-1"></i>
                    <span class="text-dark small fw-bold">Mercado Pago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    `;
    
    this.footerCSS = `
      /* Estilos consistentes para el footer */
      #footer {
        background-color: #1a1a1a !important;
        color: #ffffff !important;
      }
      
      #footer .bg-dark {
        background-color: #1a1a1a !important;
      }
      
      #footer .footer-menu h3 {
        color: #ffffff !important;
        font-weight: 700;
      }
      
      #footer .footer-menu h6 {
        color: #ffffff !important;
        font-weight: 600;
      }
      
      #footer .footer-menu .text-muted {
        color: #cccccc !important;
      }
      
      #footer .footer-menu a {
        color: #cccccc !important;
        transition: color 0.3s ease;
      }
      
      #footer .footer-menu a:hover {
        color: #FF6B35 !important;
      }
      
      #footer .social-links a {
        color: #cccccc !important;
        font-size: 1.2rem;
        transition: all 0.3s ease;
      }
      
      #footer .social-links a:hover {
        color: #FF6B35 !important;
        transform: translateY(-2px);
      }
      
      #footer .border-top {
        border-color: #404040 !important;
      }
      
      #footer .input-group .form-control {
        background-color: #2d2d2d !important;
        border-color: #404040 !important;
        color: #ffffff !important;
      }
      
      #footer .input-group .form-control:focus {
        background-color: #2d2d2d !important;
        border-color: #FF6B35 !important;
        color: #ffffff !important;
        box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25) !important;
      }
      
      #footer .input-group .btn-primary {
        background-color: #FF6B35 !important;
        border-color: #FF6B35 !important;
      }
      
      #footer .input-group .btn-primary:hover {
        background-color: #E55A2B !important;
        border-color: #E55A2B !important;
      }
      
      /* Estilos para badges de envío y pago */
      #footer .footer-badge {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 1px solid #e9ecef;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      #footer .footer-badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      #footer .footer-badge .text-primary {
        color: #FF6B35 !important;
      }
      
      #footer .footer-badge .text-dark {
        color: #212529 !important;
      }
      
      /* Estilos específicos para la sección inferior del footer */
      #footer .border-top {
        border-color: #404040 !important;
        margin-top: 0 !important;
      }
      
      #footer .py-4 {
        padding-top: 1.5rem !important;
        padding-bottom: 1.5rem !important;
      }
      
      #footer .container-fluid .row {
        margin: 0 !important;
      }
      
      #footer .text-muted.small {
        color: #cccccc !important;
        font-size: 0.875rem !important;
        line-height: 1.4 !important;
      }
      
      #footer .text-muted.small.mb-0 {
        margin-bottom: 0 !important;
        color: #cccccc !important;
        font-size: 0.875rem !important;
      }
      
      #footer .text-muted.small:not(.mb-0) {
        color: #cccccc !important;
        font-size: 0.8rem !important;
        white-space: nowrap !important;
      }
      
      #footer .text-md-end {
        text-align: right !important;
      }
      
      #footer .d-flex.justify-content-md-end {
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 0.75rem !important;
      }
      
      #footer .ms-3 {
        margin-left: 1rem !important;
      }
      
      /* Estilos específicos para el copyright */
      #footer .container-fluid .row .col-md-6:first-child p {
        color: #cccccc !important;
        font-size: 0.875rem !important;
        margin-bottom: 0 !important;
        line-height: 1.4 !important;
      }
      
      /* Estilos específicos para los badges */
      #footer .container-fluid .row .col-md-6:last-child {
        text-align: right !important;
      }
      
      #footer .container-fluid .row .col-md-6:last-child .d-flex {
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 0.75rem !important;
        flex-wrap: nowrap !important;
      }
      
      #footer .container-fluid .row .col-md-6:last-child .text-muted {
        color: #cccccc !important;
        font-size: 0.8rem !important;
        white-space: nowrap !important;
        margin: 0 !important;
      }
      
      /* Responsive para móviles */
      @media (max-width: 768px) {
        #footer .text-md-end {
          text-align: left !important;
          margin-top: 1rem !important;
        }
        
        #footer .d-flex.justify-content-md-end {
          justify-content: flex-start !important;
          flex-wrap: wrap !important;
        }
        
        #footer .container-fluid .row .col-md-6:last-child {
          text-align: left !important;
        }
        
        #footer .container-fluid .row .col-md-6:last-child .d-flex {
          justify-content: flex-start !important;
          flex-wrap: wrap !important;
        }
      }
    `;
  }

  // Método para renderizar el footer
  render(containerId = 'footer') {
    console.log('🔧 FooterComponent: Intentando renderizar footer...');
    const container = document.getElementById(containerId);
    if (container) {
      console.log('✅ FooterComponent: Contenedor encontrado, renderizando...');
      container.innerHTML = this.footerHTML;
      console.log('✅ FooterComponent: Footer renderizado exitosamente');
    } else {
      console.error('❌ FooterComponent: No se encontró el contenedor con ID:', containerId);
    }
  }

  // Método para agregar los estilos CSS
  addStyles() {
    // Verificar si los estilos ya existen
    if (document.getElementById('footer-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'footer-styles';
    style.textContent = this.footerCSS;
    document.head.appendChild(style);
  }

  // Método para inicializar el footer
  init(containerId = 'footer') {
    console.log('🚀 FooterComponent: Inicializando footer...');
    this.addStyles();
    this.render(containerId);
  }
}

// Exportar para uso global
window.FooterComponent = FooterComponent;

// Función de inicialización automática
function initFooter() {
  console.log('🚀 Inicializando footer automáticamente...');
  if (typeof FooterComponent !== 'undefined') {
    const footer = new FooterComponent();
    footer.init();
  } else {
    console.error('❌ FooterComponent no está disponible');
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooter);
} else {
  initFooter();
}
