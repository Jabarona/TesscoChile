// logo-loader.js - Cargador automático de logo para Tessco Chile

class LogoLoader {
  constructor() {
    this.logoPath = null;
    this.init();
  }

  // Inicializar
  init() {
    this.loadLogoFromStorage();
    this.updateAllLogos();
  }

  // Cargar logo desde localStorage
  loadLogoFromStorage() {
    this.logoPath = localStorage.getItem('companyLogo');
  }

  // Obtener URL del logo
  getLogoUrl() {
    if (!this.logoPath) return null;
    
    if (window.config && window.config.getImageUrl) {
      return window.config.getImageUrl(this.logoPath);
    }
    const frontendUrl = window.config ? window.config.frontendUrl : 'http://localhost:3000';
    return `${frontendUrl}${this.logoPath}`;
  }

  // Actualizar todos los logos en la página
  updateAllLogos() {
    const logoUrl = this.getLogoUrl();
    
    // Selectores para diferentes tipos de logos
    const logoSelectors = [
      '.logo-img',
      '.navbar-brand img',
      '.footer-logo img',
      '.header-logo img',
      '.site-logo img',
      'img[alt*="logo" i]',
      'img[alt*="Logo" i]',
      'img[alt*="LOGO" i]'
    ];

    logoSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element.dataset.logoStatic === 'true') {
          return;
        }
        if (logoUrl) {
          element.src = logoUrl;
          element.style.display = 'block';
          element.classList.add('logo-loaded');
          
          // Aplicar estilos específicos según el tipo de logo
          this.applyLogoStyles(element, selector);
        } else {
          // Si no hay logo, mostrar logo por defecto o ocultar
          const defaultLogo = element.getAttribute('data-default-src');
          if (defaultLogo) {
            element.src = defaultLogo;
            this.applyLogoStyles(element, selector);
          } else {
            element.style.display = 'none';
          }
          element.classList.remove('logo-loaded');
        }
      });
    });

    // Actualizar favicon si existe
    this.updateFavicon(logoUrl);
  }

  // Aplicar estilos específicos según el tipo de logo
  applyLogoStyles(element, selector) {
    // Resetear estilos
    element.style.maxWidth = '';
    element.style.maxHeight = '';
    element.style.width = '';
    element.style.height = '';
    element.style.objectFit = '';
    element.style.objectPosition = '';

    // Aplicar estilos según el selector
    if (selector.includes('navbar-brand') || selector.includes('header-logo')) {
      // Logo del header - más pequeño y alineado a la izquierda
      element.style.maxHeight = '40px';
      element.style.maxWidth = '150px';
      element.style.width = 'auto';
      element.style.height = 'auto';
      element.style.objectFit = 'contain';
      element.style.objectPosition = 'left center';
    } else if (selector.includes('footer-logo')) {
      // Logo del footer - tamaño medio y centrado
      element.style.maxHeight = '50px';
      element.style.maxWidth = '200px';
      element.style.width = 'auto';
      element.style.height = 'auto';
      element.style.objectFit = 'contain';
      element.style.objectPosition = 'center';
    } else {
      // Otros logos - tamaño estándar
      element.style.maxHeight = '60px';
      element.style.maxWidth = '100%';
      element.style.width = 'auto';
      element.style.height = 'auto';
      element.style.objectFit = 'contain';
      element.style.objectPosition = 'center';
    }
  }

  // Actualizar favicon
  updateFavicon(logoUrl) {
    if (!logoUrl) return;

    // Crear canvas para generar favicon
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 32;
    canvas.height = 32;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Dibujar imagen redimensionada en el canvas
      ctx.drawImage(img, 0, 0, 32, 32);
      
      // Crear favicon
      const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = canvas.toDataURL('image/png');
      
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(favicon);
      }
    };
    img.src = logoUrl;
  }

  // Establecer nuevo logo
  setLogo(logoPath) {
    this.logoPath = logoPath;
    if (logoPath) {
      localStorage.setItem('companyLogo', logoPath);
    } else {
      localStorage.removeItem('companyLogo');
    }
    this.updateAllLogos();
  }

  // Obtener logo actual
  getCurrentLogo() {
    return this.logoPath;
  }
}

// Crear instancia global del LogoLoader
let logoLoader;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que la configuración esté disponible
  setTimeout(() => {
    logoLoader = new LogoLoader();
    window.logoLoader = logoLoader; // Hacer disponible globalmente
    console.log('🔧 LogoLoader inicializado');
  }, 200);
});

// Función global para actualizar logo
window.updateLogo = (logoPath) => {
  logoLoader.setLogo(logoPath);
};

// Función global para obtener logo actual
window.getCurrentLogo = () => {
  return logoLoader.getCurrentLogo();
};

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogoLoader;
} else {
  window.LogoLoader = LogoLoader;
}
