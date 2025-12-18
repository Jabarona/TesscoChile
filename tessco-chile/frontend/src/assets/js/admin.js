// admin.js - Funcionalidades del panel administrativo

class AdminManager {
  constructor() {
    // Usar configuración dinámica si está disponible
    if (window.config && window.config.apiBaseUrl) {
      this.apiUrl = `${window.config.apiBaseUrl}/api`;
    } else {
      this.apiUrl = 'http://localhost:4000/api';
    }
    this.auth = new AuthManager();
  }

  // Verificar autenticación de admin
  checkAdminAuth() {
    if (!this.auth.isAdmin()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  }

  // Mostrar notificaciones
  showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Guardar contenido de la página de inicio
  async saveHomepageContent() {
    if (!this.checkAdminAuth()) return;

    try {
      const content = {
        hero: {
          title: document.getElementById('heroTitle')?.value || '',
          subtitle: document.getElementById('heroSubtitle')?.value || '',
          buttonText: document.getElementById('heroButtonText')?.value || '',
          image: document.getElementById('heroImage')?.files[0] || null
        },
        newsletter: {
          title: document.getElementById('newsletterTitle')?.value || '',
          subtitle: document.getElementById('newsletterSubtitle')?.value || '',
          image: document.getElementById('newsletterImage')?.files[0] || null
        },
        featuredProducts: {
          title: document.getElementById('featuredProductsTitle')?.value || ''
        }
      };

      const response = await fetch(`${this.apiUrl}/admin/homepage`, {
        method: 'PUT',
        headers: this.auth.getAuthHeaders(),
        body: JSON.stringify(content)
      });

      if (response.ok) {
        this.showNotification('Contenido guardado exitosamente', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.message || 'Error al guardar', 'danger');
      }
    } catch (error) {
      this.showNotification('Error de conexión', 'danger');
      console.error('Save homepage error:', error);
    }
  }

  // Vista previa de la página de inicio
  previewHomepage() {
    window.open('/', '_blank');
  }

  // Cargar estadísticas del dashboard
  async loadDashboardStats() {
    if (!this.checkAdminAuth()) return;

    try {
      const response = await fetch(`${this.apiUrl}/admin/stats`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const stats = await response.json();
        this.updateStatsCards(stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }

  // Actualizar tarjetas de estadísticas
  updateStatsCards(stats) {
    // Actualizar usuarios
    const usersElement = document.getElementById('totalUsers');
    if (usersElement && typeof stats.totalUsers !== 'undefined') {
      usersElement.textContent = stats.totalUsers;
    }

    // Actualizar pedidos (usamos pedidos pendientes por ahora)
    const ordersElement = document.getElementById('totalOrders');
    if (ordersElement && typeof stats.pendingOrders !== 'undefined') {
      ordersElement.textContent = stats.pendingOrders;
    }

    // Actualizar productos
    const productsElement = document.getElementById('totalProducts');
    if (productsElement && typeof stats.totalProducts !== 'undefined') {
      productsElement.textContent = stats.totalProducts;
    }

    // Actualizar ventas totales
    const salesElement = document.getElementById('totalRevenue');
    if (salesElement && typeof stats.totalSales !== 'undefined') {
      const totalSales = Number(stats.totalSales) || 0;
      salesElement.textContent = `$${totalSales.toLocaleString('es-CL')}`;
    }
  }

  // Cargar pedidos recientes
  async loadRecentOrders() {
    if (!this.checkAdminAuth()) return;

    try {
      const response = await fetch(`${this.apiUrl}/admin/orders/recent`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const orders = await response.json();
        this.updateOrdersTable(orders);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    }
  }

  // Actualizar tabla de pedidos
  updateOrdersTable(orders) {
    const tbody = document.querySelector('#dataTable tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.user.firstName} ${order.user.lastName}</td>
        <td>${order.items.length} producto(s)</td>
        <td>$${order.total.toLocaleString()}</td>
        <td><span class="badge bg-${this.getStatusColor(order.status)}">${this.getStatusText(order.status)}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewOrder('${order.id}')">Ver</button>
        </td>
      </tr>
    `).join('');
  }

  // Obtener color del estado
  getStatusColor(status) {
    const colors = {
      'pending': 'warning',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  }

  // Obtener texto del estado
  getStatusText(status) {
    const texts = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return texts[status] || status;
  }

  // Ver pedido
  viewOrder(orderId) {
    // Implementar vista de pedido
    console.log('View order:', orderId);
  }

  // Inicializar panel admin
  init() {
    if (!this.checkAdminAuth()) return;

    // Cargar datos del dashboard
    this.loadDashboardStats();
    this.loadRecentOrders();

    // Configurar event listeners
    this.setupEventListeners();
  }

  // Configurar event listeners
  setupEventListeners() {
    // Botón de guardar contenido
    const saveButton = document.querySelector('[onclick="saveHomepageContent()"]');
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveHomepageContent());
    }

    // Botón de vista previa
    const previewButton = document.querySelector('[onclick="previewHomepage()"]');
    if (previewButton) {
      previewButton.addEventListener('click', () => this.previewHomepage());
    }

    // Preview de imágenes
    this.setupImagePreviews();
  }

  // Configurar preview de imágenes
  setupImagePreviews() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
    imageInputs.forEach(input => {
      input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            const preview = document.getElementById(input.id + 'Preview');
            if (preview) {
              preview.src = e.target.result;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }
}

// Instancia global
const admin = new AdminManager();

// Funciones globales
function saveHomepageContent() {
  admin.saveHomepageContent();
}

function previewHomepage() {
  admin.previewHomepage();
}

function logout() {
  admin.auth.logout();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  admin.init();
});
