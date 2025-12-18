// auth.js - Sistema de autenticación para Tessco Chile

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.initApiUrl();
  }

  // Inicializar URL de la API
  initApiUrl() {
    if (window.config && window.config.getApiUrl) {
      this.apiUrl = window.config.getApiUrl(window.config.endpoints.auth);
    } else {
      this.apiUrl = 'http://localhost:4000/api/auth';
    }
    console.log('🔧 AuthManager API URL:', this.apiUrl);
  }

  // Mostrar alertas
  showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
      alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }
  }

  // Login
  async login(email, password) {
    try {
      console.log('🔐 Intentando login con:', { email, password: '***' });
      console.log('🌐 URL del backend:', `${this.apiUrl}/login`);
      
      const response = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);

      if (response.ok) {
        this.token = data.data.token;
        this.user = data.data.user;
        
        console.log('✅ Login exitoso, token:', this.token ? 'Generado' : 'No generado');
        console.log('👤 Usuario:', this.user);
        
        if (window.terminalLogger) {
          window.terminalLogger.success('Login exitoso', { 
            email: this.user.email, 
            role: this.user.role,
            hasToken: !!this.token 
          });
        }
        
        // Guardar en localStorage
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));

        // Emitir evento de login
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: this.user } }));

        // Redirigir según el rol
        if (this.user.role === 'admin') {
          console.log('🔑 Usuario admin, redirigiendo a /admin');
          if (window.terminalLogger) {
            window.terminalLogger.auth('Redirigiendo admin a /admin');
          }
          window.location.href = '/admin';
        } else {
          console.log('👤 Usuario normal, redirigiendo a /');
          if (window.terminalLogger) {
            window.terminalLogger.auth('Redirigiendo usuario a /');
          }
          window.location.href = '/';
        }
      } else {
        console.error('❌ Error en login:', data);
        this.showAlert(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('💥 Error de conexión:', error);
      this.showAlert('Error de conexión. Intenta nuevamente.');
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.showAlert('Cuenta creada exitosamente. Inicia sesión.', 'success');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        this.showAlert(data.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      this.showAlert('Error de conexión. Intenta nuevamente.');
      console.error('Register error:', error);
    }
  }

  // Logout
  logout(options = {}) {
    const {
      redirect = true,
      redirectUrl = '/',
      delay = 100,
      emitEvent = true,
      reason = 'logout'
    } = options;

    console.log('🚪 Ejecutando logout...', { reason, redirect, redirectUrl });
    console.trace('📍 Stack trace del logout');
    
    if (window.terminalLogger) {
      window.terminalLogger.auth('Ejecutando logout', { reason, redirect });
      window.terminalLogger.debug('Stack trace del logout', { 
        stack: new Error().stack,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
    
    setTimeout(() => {
      this.clearSession({ emitEvent });
      
      if (redirect) {
        console.log('🔄 Redirigiendo a', redirectUrl);
        window.location.href = redirectUrl;
      }
    }, delay);
  }

  clearSession({ emitEvent = true } = {}) {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    if (emitEvent) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  // Verificar sesión automáticamente
  async checkSession() {
    console.log('🔍 Iniciando verificación de sesión...');
    if (window.terminalLogger) {
      window.terminalLogger.debug('Iniciando verificación de sesión');
    }
    
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Token presente:', !!token);
    console.log('🔍 Usuario presente:', !!user);
    
    if (!token || !user) {
      console.log('🔍 No hay sesión guardada');
      if (window.terminalLogger) {
        window.terminalLogger.info('No hay sesión guardada', { hasToken: !!token, hasUser: !!user });
      }
      return false;
    }

    try {
      // Verificar si el token es válido
      const response = await fetch(`${this.apiUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        this.token = token;
        this.user = JSON.parse(user);
        console.log('✅ Sesión válida restaurada:', this.user.email);
        if (window.terminalLogger) {
          window.terminalLogger.success('Sesión válida restaurada', { email: this.user.email });
        }
        
        // Actualizar información del usuario en la página
        this.updateUserInfo();
        return true;
      } else {
        const responseText = await response.text();
        console.log('⚠️ Error verificando sesión');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', responseText);
        
        if (window.terminalLogger) {
          window.terminalLogger.warn('Error verificando sesión', { 
            status: response.status, 
            response: responseText 
          });
        }

        if (response.status === 401 || response.status === 403) {
          console.log('❌ Sesión inválida según el backend, limpiando credenciales sin redirigir automáticamente.');
          if (window.showNotification) {
            window.showNotification('Tu sesión ha expirado. Inicia sesión nuevamente para continuar.', 'warning');
          }
          this.clearSession();
          return false;
        }

        // Para otros errores, mantener la sesión local para evitar cierres inesperados
        console.warn('⚠️ Manteniendo sesión local a pesar del error en la verificación.');
        return false;
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      if (window.terminalLogger) {
        window.terminalLogger.error('Error verificando sesión', { error: error.message, stack: error.stack });
      }

      if (window.showNotification) {
        window.showNotification('No se pudo verificar tu sesión por un problema de conexión. Continuaremos con tu sesión actual.', 'info');
      }

      // Mantener la sesión local ante fallas de red u otros errores
      return this.isAuthenticated();
    }
  }

  // Actualizar información del usuario en la página
  updateUserInfo() {
    if (!this.user) return;

    // Actualizar nombre en dropdowns
    const adminNameElements = document.querySelectorAll('#adminName, .admin-name, .user-name');
    adminNameElements.forEach(element => {
      element.textContent = `${this.user.firstName} ${this.user.lastName}`;
    });

    // Mostrar/ocultar elementos según el rol
    if (this.user.role === 'admin') {
      const adminElements = document.querySelectorAll('.admin-only');
      adminElements.forEach(element => {
        element.style.display = 'block';
      });
    }
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Verificar si es admin
  isAdmin() {
    return this.isAuthenticated() && this.user.role === 'admin';
  }

  // Obtener headers con token
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }
}

// Instancia global
// Crear instancia global del AuthManager
let auth;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM cargado, inicializando AuthManager...');
  
  // Esperar a que la configuración esté disponible
  setTimeout(() => {
    console.log('🔧 Creando instancia de AuthManager...');
    auth = new AuthManager();
    auth.initApiUrl();
    window.auth = auth; // Hacer disponible globalmente
    console.log('🔧 AuthManager inicializado');
    
    if (window.terminalLogger) {
      window.terminalLogger.success('AuthManager inicializado');
    }
    
    // Verificar sesión automáticamente
    console.log('🔍 Iniciando verificación automática de sesión...');
    auth.checkSession();
  }, 100);
});

// Event listeners para login
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    console.log('📝 Formulario de login encontrado, agregando event listener');
    loginForm.addEventListener('submit', async function(e) {
      console.log('🚀 Formulario enviado');
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      console.log('📧 Email:', email);
      console.log('🔒 Password length:', password.length);

      if (!email || !password) {
        console.log('❌ Campos vacíos');
        auth.showAlert('Por favor completa todos los campos');
        return;
      }

      console.log('✅ Campos válidos, procediendo con login');
      await auth.login(email, password);
    });
  } else {
    // Solo mostrar error si estamos en la página de login
    if (window.location.pathname.includes('/login')) {
      console.error('❌ Formulario de login no encontrado');
    }
  }

  // Event listeners para registro
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
      };

      // Validaciones
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        auth.showAlert('Por favor completa todos los campos obligatorios');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        auth.showAlert('Las contraseñas no coinciden');
        return;
      }

      if (formData.password.length < 8) {
        auth.showAlert('La contraseña debe tener al menos 8 caracteres');
        return;
      }

      // Remover confirmPassword del objeto
      delete formData.confirmPassword;

      await auth.register(formData);
    });
  }

  // Toggle password visibility
  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = this.querySelector('i');
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  }

  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('confirmPassword');
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = this.querySelector('i');
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  }
});

// Función global para logout
function logout() {
  auth.logout();
}

// Verificar autenticación en páginas protegidas
function requireAuth() {
  if (!auth.isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Verificar rol de admin
function requireAdmin() {
  if (!auth.isAdmin()) {
    window.location.href = '/';
    return false;
  }
  return true;
}
