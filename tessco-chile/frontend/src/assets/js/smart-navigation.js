// smart-navigation.js - Navegación inteligente basada en el estado de autenticación

class SmartNavigation {
  constructor() {
    this.init();
  }

  init() {
    // Esperar a que auth esté disponible
    const checkAuth = setInterval(() => {
      if (window.auth) {
        clearInterval(checkAuth);
        this.updateAccountButton();
        this.setupEventListeners();
      }
    }, 100);
  }

  // Actualizar el botón "Mi Cuenta" según el estado de autenticación
  updateAccountButton() {
    const accountDropdownWrapper = document.getElementById('accountDropdownWrapper');
    const accountButton = document.getElementById('accountDropdown');
    const accountMenu = document.getElementById('accountMenu');

    if (!accountButton || !accountMenu || !accountDropdownWrapper) {
      return;
    }

    if (window.auth && window.auth.isAuthenticated()) {
      const user = window.auth.user;
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Mi Cuenta';

      accountButton.href = '/user/profile';
      accountButton.innerHTML = `<i class="fas fa-user-circle me-2"></i>${displayName}`;

      const items = [];
      items.push(`<li><a class="dropdown-item" href="/user/profile"><i class="fas fa-id-badge me-2"></i>Mi Perfil</a></li>`);
      items.push(`<li><a class="dropdown-item" href="/user/orders"><i class="fas fa-box-open me-2"></i>Mis Pedidos</a></li>`);
      items.push(`<li><a class="dropdown-item" href="/wishlist"><i class="fas fa-heart me-2"></i>Mis Favoritos</a></li>`);

      if (user.role === 'admin') {
        items.push(`<li><a class="dropdown-item" href="/admin"><i class="fas fa-tools me-2"></i>Panel Admin</a></li>`);
      }

      items.push('<li><hr class="dropdown-divider"></li>');
      items.push(`<li><a class="dropdown-item text-danger" href="#" id="logoutLink"><i class="fas fa-sign-out-alt me-2"></i>Cerrar sesión</a></li>`);

      accountMenu.innerHTML = items.join('');

      const logoutLink = document.getElementById('logoutLink');
      if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
          event.preventDefault();
          if (window.auth) {
            window.auth.logout();
          }
        });
      }
    } else {
      accountButton.href = '/login';
      accountButton.innerHTML = '<i class="fas fa-user-circle me-2"></i>Mi Cuenta';
      accountMenu.innerHTML = `
        <li><a class="dropdown-item" href="/login"><i class="fas fa-sign-in-alt me-2"></i>Iniciar sesión</a></li>
        <li><a class="dropdown-item" href="/register"><i class="fas fa-user-plus me-2"></i>Crear cuenta</a></li>
      `;
    }
  }

  // Configurar listeners para cambios de autenticación
  setupEventListeners() {
    // Escuchar eventos personalizados de login/logout
    window.addEventListener('auth:login', () => {
      this.updateAccountButton();
    });

    window.addEventListener('auth:logout', () => {
      this.updateAccountButton();
    });

    // Verificar cambios en localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        this.updateAccountButton();
      }
    });
  }

  // Método para forzar actualización
  refresh() {
    this.updateAccountButton();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.smartNav = new SmartNavigation();
});
