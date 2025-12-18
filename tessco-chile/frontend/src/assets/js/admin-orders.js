// admin-orders.js - Gestión de pedidos para el panel administrativo

(() => {
  const STATE_MAP = {
    pending: { label: 'Solicitado', badge: 'warning' },
    confirmed: { label: 'Confirmado', badge: 'success' },
    processing: { label: 'En preparación', badge: 'info' },
    shipped: { label: 'Despachado', badge: 'primary' },
    delivered: { label: 'Entregado', badge: 'success' },
    cancelled: { label: 'Cancelado', badge: 'danger' }
  };

  const PAYMENT_STATE_MAP = {
    pending: { label: 'Pendiente', badge: 'warning' },
    paid: { label: 'Pagado', badge: 'success' },
    failed: { label: 'Fallido', badge: 'danger' },
    refunded: { label: 'Reembolsado', badge: 'info' }
  };

  const PAGE_LIMIT = 10;

  let rawOrders = [];
  let orders = [];
  let pagination = {
    page: 1,
    pages: 1,
    total: 0,
    limit: PAGE_LIMIT
  };

  let filters = {
    status: '',
    paymentStatus: '',
    customer: '',
    orderId: ''
  };

  let selectedOrder = null;
  let modalInstance = null;

  const elements = {
    tableBody: document.querySelector('#ordersTable tbody'),
    pagination: document.getElementById('ordersPagination'),
    emptyState: document.getElementById('ordersEmptyState'),
    statusFilter: document.getElementById('statusFilter'),
    paymentStatusFilter: document.getElementById('paymentStatusFilter'),
    customerFilter: document.getElementById('customerFilter'),
    orderIdFilter: document.getElementById('orderIdFilter'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    refreshBtn: document.getElementById('refreshOrdersBtn'),
    modal: document.getElementById('orderDetailsModal'),
    modalOrderId: document.getElementById('modalOrderId'),
    modalCustomer: document.getElementById('modalCustomer'),
    modalCustomerEmail: document.getElementById('modalCustomerEmail'),
    modalOrderTotal: document.getElementById('modalOrderTotal'),
    modalOrderStatus: document.getElementById('modalOrderStatus'),
    modalPaymentStatus: document.getElementById('modalPaymentStatus'),
    modalPaymentMethod: document.getElementById('modalPaymentMethod'),
    modalCreatedAt: document.getElementById('modalCreatedAt'),
    modalItemsContainer: document.getElementById('orderItemsContainer'),
    modalTimeline: document.getElementById('orderTimeline'),
    modalStatusSelect: document.getElementById('modalStatusSelect'),
    modalPaymentStatusSelect: document.getElementById('modalPaymentStatusSelect'),
    modalUpdateBtn: document.getElementById('modalUpdateOrderBtn')
  };

  async function ensureAuthReady() {
    if (window.auth && window.auth.isAdmin && window.auth.isAdmin()) {
      return true;
    }

    return new Promise(resolve => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (window.auth && window.auth.isAdmin && window.auth.isAdmin()) {
          clearInterval(interval);
          resolve(true);
        }
        if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 150);
    });
  }

  function getApiBaseUrl() {
    if (window.config && window.config.apiBaseUrl) {
      return `${window.config.apiBaseUrl}/api`;
    }
    if (window.ENV && window.ENV.API_BASE_URL) {
      return `${window.ENV.API_BASE_URL}/api`;
    }
    return 'http://localhost:4000/api';
  }

  function formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString));
  }

  function getStatusMeta(status) {
    return STATE_MAP[status] || { label: status || 'N/A', badge: 'secondary' };
  }

  function getPaymentMeta(paymentStatus) {
    return PAYMENT_STATE_MAP[paymentStatus] || { label: paymentStatus || 'N/A', badge: 'secondary' };
  }

  function renderOrders() {
    if (!elements.tableBody) return;

    const filteredOrders = applyLocalFilters(rawOrders);
    orders = filteredOrders;

    if (!filteredOrders.length) {
      elements.tableBody.innerHTML = '';
      elements.emptyState?.classList.remove('d-none');
      return;
    }

    elements.emptyState?.classList.add('d-none');

    elements.tableBody.innerHTML = filteredOrders.map(order => {
      const statusMeta = getStatusMeta(order.status);
      const paymentMeta = getPaymentMeta(order.paymentStatus);
      const customerName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Cliente';

      return `
        <tr data-order-id="${order.id}">
          <td>
            <div class="d-flex flex-column">
              <span class="order-id fw-semibold">#${order.id}</span>
              <small class="text-muted">Creado ${formatDate(order.createdAt)}</small>
            </div>
          </td>
          <td>
            <div class="d-flex flex-column">
              <span class="fw-semibold">${customerName || 'Sin nombre'}</span>
              <small class="text-muted">${order.user?.email || '-'}</small>
            </div>
          </td>
          <td>${order.items?.length || 0}</td>
          <td class="fw-semibold">${formatCurrency(order.total)}</td>
          <td>
            <span class="badge bg-${statusMeta.badge}">
              <span class="status-dot" style="background-color: var(--bs-${statusMeta.badge});"></span>
              ${statusMeta.label}
            </span>
          </td>
          <td>
            <span class="badge bg-${paymentMeta.badge}">${paymentMeta.label}</span>
          </td>
          <td>${formatDate(order.createdAt)}</td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-light" data-action="view">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-primary" data-action="status">
                <i class="fas fa-pencil-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderPagination() {
    if (!elements.pagination) return;

    const { page, pages } = pagination;

    if (pages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }

    const pageButtons = [];

    for (let i = 1; i <= pages; i += 1) {
      const active = i === page ? 'active' : '';
      pageButtons.push(`
        <li class="page-item ${active}">
          <button class="page-link" data-page="${i}">${i}</button>
        </li>
      `);
    }

    elements.pagination.innerHTML = `
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <button class="page-link" data-page="${page - 1}" aria-label="Anterior">
          <span aria-hidden="true">&laquo;</span>
        </button>
      </li>
      ${pageButtons.join('')}
      <li class="page-item ${page === pages ? 'disabled' : ''}">
        <button class="page-link" data-page="${page + 1}" aria-label="Siguiente">
          <span aria-hidden="true">&raquo;</span>
        </button>
      </li>
    `;
  }

  function applyLocalFilters(data) {
    const { customer, orderId, status, paymentStatus } = filters;

    return data.filter(order => {
      const statusMatch = status ? (order.status === status) : true;
      const paymentMatch = paymentStatus ? (order.paymentStatus === paymentStatus) : true;
      const customerMatch = customer
        ? (
          (order.user?.firstName || '').toLowerCase().includes(customer.toLowerCase()) ||
          (order.user?.lastName || '').toLowerCase().includes(customer.toLowerCase()) ||
          (order.user?.email || '').toLowerCase().includes(customer.toLowerCase())
        ) : true;

      const orderIdMatch = orderId
        ? order.id.toLowerCase().includes(orderId.toLowerCase())
        : true;

      return statusMatch && paymentMatch && customerMatch && orderIdMatch;
    });
  }

  async function fetchOrders(page = 1) {
    if (!await ensureAuthReady()) {
      window.location.href = '/login';
      return;
    }

    try {
      const apiUrl = `${getApiBaseUrl()}/orders/admin/all`;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_LIMIT.toString()
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);

      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        headers: window.auth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de pedidos');
      }

      const data = await response.json();

      pagination = data.pagination || pagination;
      rawOrders = Array.isArray(data.orders) ? data.orders : [];
      renderOrders();
      renderPagination();
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      if (window.admin?.showNotification) {
        window.admin.showNotification('No se pudieron cargar los pedidos. Intenta nuevamente.', 'danger');
      }
    }
  }

  function populateModal(order) {
    if (!order) return;

    selectedOrder = order;

    const statusMeta = getStatusMeta(order.status);
    const paymentMeta = getPaymentMeta(order.paymentStatus);
    const customerName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Cliente';

    elements.modalOrderId.textContent = `#${order.id}`;
    elements.modalCustomer.textContent = customerName || 'Sin nombre';
    elements.modalCustomerEmail.textContent = order.user?.email || '-';
    elements.modalOrderTotal.textContent = formatCurrency(order.total);
    elements.modalOrderStatus.innerHTML = `<span class="badge bg-${statusMeta.badge}">${statusMeta.label}</span>`;
    elements.modalPaymentStatus.innerHTML = `<span class="badge bg-${paymentMeta.badge}">${paymentMeta.label}</span>`;
    elements.modalPaymentMethod.textContent = order.paymentMethod || 'No informado';
    elements.modalCreatedAt.textContent = formatDate(order.createdAt);

    elements.modalStatusSelect.value = order.status || 'pending';
    elements.modalPaymentStatusSelect.value = order.paymentStatus || 'pending';

    if (Array.isArray(order.items) && order.items.length) {
      elements.modalItemsContainer.innerHTML = order.items.map(item => `
        <div class="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary border-opacity-25">
          <div class="d-flex flex-column">
            <span class="fw-semibold">${item.product?.name || 'Producto'}</span>
            <small class="text-muted">${item.quantity} x ${formatCurrency(item.price)}</small>
          </div>
          <div class="text-end">
            <span class="fw-semibold">${formatCurrency(item.total)}</span>
          </div>
        </div>
      `).join('');
    } else {
      elements.modalItemsContainer.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="fas fa-box-open fa-2x mb-2"></i>
          <p class="mb-0">No hay productos asociados al pedido.</p>
        </div>
      `;
    }

    elements.modalTimeline.innerHTML = `
      <div class="timeline-item">
        <p class="mb-1 fw-semibold">${statusMeta.label}</p>
        <small class="text-muted">Última actualización: ${formatDate(order.updatedAt)}</small>
      </div>
      <div class="timeline-item">
        <p class="mb-1 fw-semibold">Creado</p>
        <small class="text-muted">${formatDate(order.createdAt)}</small>
      </div>
    `;
  }

  async function updateOrderStatus(orderId, status, paymentStatus) {
    if (!await ensureAuthReady()) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/orders/admin/${orderId}`, {
        method: 'PUT',
        headers: window.auth.getAuthHeaders(),
        body: JSON.stringify({ status, paymentStatus })
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el pedido');
      }

      if (window.admin?.showNotification) {
        window.admin.showNotification('Pedido actualizado correctamente', 'success');
      }

      await fetchOrders(pagination.page);
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      if (window.admin?.showNotification) {
        window.admin.showNotification('No se pudo actualizar el pedido. Intenta nuevamente.', 'danger');
      }
    }
  }

  function attachEventListeners() {
    if (elements.pagination) {
      elements.pagination.addEventListener('click', event => {
        const target = event.target.closest('[data-page]');
        if (!target) return;
        const page = parseInt(target.getAttribute('data-page'), 10);
        if (Number.isNaN(page) || page < 1 || page === pagination.page || page > pagination.pages) return;
        fetchOrders(page);
      });
    }

    if (elements.tableBody) {
      elements.tableBody.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const row = button.closest('tr[data-order-id]');
        const orderId = row?.getAttribute('data-order-id');
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        if (button.dataset.action === 'view') {
          populateModal(order);
          if (!modalInstance) {
            modalInstance = bootstrap.Modal.getOrCreateInstance(elements.modal);
          }
          modalInstance.show();
        }

        if (button.dataset.action === 'status') {
          populateModal(order);
          if (!modalInstance) {
            modalInstance = bootstrap.Modal.getOrCreateInstance(elements.modal);
          }
          modalInstance.show();
        }
      });
    }

    if (elements.clearFiltersBtn) {
      elements.clearFiltersBtn.addEventListener('click', () => {
        filters = { status: '', paymentStatus: '', customer: '', orderId: '' };
        elements.statusFilter.value = '';
        elements.paymentStatusFilter.value = '';
        elements.customerFilter.value = '';
        elements.orderIdFilter.value = '';
        fetchOrders(1);
      });
    }

    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', () => {
        fetchOrders(pagination.page);
      });
    }

    if (elements.statusFilter) {
      elements.statusFilter.addEventListener('change', event => {
        filters.status = event.target.value;
        fetchOrders(1);
      });
    }

    if (elements.paymentStatusFilter) {
      elements.paymentStatusFilter.addEventListener('change', event => {
        filters.paymentStatus = event.target.value;
        fetchOrders(1);
      });
    }

    const debounce = (fn, delay = 300) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    };

    if (elements.customerFilter) {
      elements.customerFilter.addEventListener('input', debounce(event => {
        filters.customer = event.target.value;
        renderOrders();
      }, 250));
    }

    if (elements.orderIdFilter) {
      elements.orderIdFilter.addEventListener('input', debounce(event => {
        filters.orderId = event.target.value;
        renderOrders();
      }, 250));
    }

    if (elements.modalUpdateBtn) {
      elements.modalUpdateBtn.addEventListener('click', async () => {
        if (!selectedOrder) return;
        const newStatus = elements.modalStatusSelect.value;
        const newPaymentStatus = elements.modalPaymentStatusSelect.value;
        await updateOrderStatus(selectedOrder.id, newStatus, newPaymentStatus);
        if (modalInstance) {
          modalInstance.hide();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const authReady = await ensureAuthReady();
    if (!authReady) {
      window.location.href = '/login';
      return;
    }

    if (!window.auth.isAdmin()) {
      window.location.href = '/login';
      return;
    }

    if (window.auth.user) {
      const adminNameElement = document.getElementById('adminName');
      if (adminNameElement) {
        adminNameElement.textContent = `${window.auth.user.firstName} ${window.auth.user.lastName}`;
      }
    }

    attachEventListeners();
    fetchOrders(1);
  });
})();

