// admin-users.js - Gestión de usuarios para el panel administrativo

(() => {
  const ROLE_LABELS = {
    admin: { text: 'Administrador', badge: 'warning' },
    user: { text: 'Usuario', badge: 'secondary' }
  };

  const VERIFIED_LABELS = {
    true: { text: 'Verificado', badge: 'success' },
    false: { text: 'No verificado', badge: 'danger' }
  };

  const PAGE_LIMIT = 12;

  let rawUsers = [];
  let pagination = {
    page: 1,
    pages: 1,
    total: 0,
    limit: PAGE_LIMIT
  };
  let filters = {
    role: '',
    verified: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  let stats = {
    totalUsers: 0,
    adminUsers: 0,
    verifiedUsers: 0,
    recentUsers: 0
  };

  let selectedUser = null;
  let userModalInstance = null;
  let deleteModalInstance = null;

  const elements = {
    adminName: document.getElementById('adminName'),
    tableBody: document.querySelector('#usersTable tbody'),
    emptyState: document.getElementById('usersEmptyState'),
    pagination: document.getElementById('usersPagination'),
    roleFilter: document.getElementById('roleFilter'),
    verifiedFilter: document.getElementById('verifiedFilter'),
    searchFilter: document.getElementById('searchFilter'),
    sortFilter: document.getElementById('sortFilter'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    refreshBtn: document.getElementById('refreshUsersBtn'),
    statTotalUsers: document.getElementById('statTotalUsers'),
    statAdmins: document.getElementById('statAdmins'),
    statVerified: document.getElementById('statVerified'),
    statRecent: document.getElementById('statRecent'),
    modal: document.getElementById('userDetailsModal'),
    modalUserId: document.getElementById('modalUserId'),
    modalFirstName: document.getElementById('modalFirstName'),
    modalLastName: document.getElementById('modalLastName'),
    modalEmail: document.getElementById('modalEmail'),
    modalPhone: document.getElementById('modalPhone'),
    modalRut: document.getElementById('modalRut'),
    modalRole: document.getElementById('modalRole'),
    modalAddress: document.getElementById('modalAddress'),
    modalVerified: document.getElementById('modalVerified'),
    modalOrdersCount: document.getElementById('modalOrdersCount'),
    modalLastOrder: document.getElementById('modalLastOrder'),
    modalCreatedAt: document.getElementById('modalCreatedAt'),
    modalSaveBtn: document.getElementById('modalSaveUserBtn'),
    modalDeleteBtn: document.getElementById('modalDeleteUserBtn'),
    confirmDeleteModal: document.getElementById('confirmDeleteModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
  };

  function getApiBaseUrl() {
    if (window.config && window.config.apiBaseUrl) {
      return `${window.config.apiBaseUrl}/api`;
    }
    if (window.ENV && window.ENV.API_BASE_URL) {
      return `${window.ENV.API_BASE_URL}/api`;
    }
    return 'http://localhost:4000/api';
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString));
  }

  function ensureString(value) {
    return value || '';
  }

  function getFullName(user) {
    const first = ensureString(user.firstName).trim();
    const last = ensureString(user.lastName).trim();
    if (!first && !last) return 'Sin nombre';
    return `${first} ${last}`.trim();
  }

  function renderStats() {
    if (elements.statTotalUsers) {
      elements.statTotalUsers.textContent = stats.totalUsers.toLocaleString('es-CL');
    }
    if (elements.statAdmins) {
      elements.statAdmins.textContent = stats.adminUsers.toLocaleString('es-CL');
    }
    if (elements.statVerified) {
      elements.statVerified.textContent = stats.verifiedUsers.toLocaleString('es-CL');
    }
    if (elements.statRecent) {
      elements.statRecent.textContent = stats.recentUsers.toLocaleString('es-CL');
    }
  }

  function getRoleMeta(role) {
    return ROLE_LABELS[role] || { text: role || 'N/A', badge: 'secondary' };
  }

  function getVerifiedMeta(isVerified) {
    const key = isVerified ? 'true' : 'false';
    return VERIFIED_LABELS[key] || { text: 'N/A', badge: 'secondary' };
  }

  function renderUsers() {
    if (!elements.tableBody) return;

    if (!rawUsers.length) {
      elements.tableBody.innerHTML = '';
      elements.emptyState?.classList.remove('d-none');
      return;
    }

    elements.emptyState?.classList.add('d-none');

    elements.tableBody.innerHTML = rawUsers.map(user => {
      const roleMeta = getRoleMeta(user.role);
      const verifiedMeta = getVerifiedMeta(user.isVerified);

      return `
        <tr data-user-id="${user.id}">
          <td>
            <div class="d-flex flex-column">
              <span class="fw-semibold">${getFullName(user)}</span>
              <small class="text-muted">${user.email || '-'}</small>
            </div>
          </td>
          <td>
            <div class="d-flex flex-column">
              <small><i class="fas fa-phone me-1"></i>${user.phone || '-'}</small>
              <small><i class="fas fa-id-card me-1"></i>${user.rut || '-'}</small>
            </div>
          </td>
          <td>
            <span class="badge bg-${roleMeta.badge}">${roleMeta.text}</span>
          </td>
          <td>
            <span class="badge bg-${verifiedMeta.badge}">${verifiedMeta.text}</span>
          </td>
          <td>
            <div class="d-flex flex-column">
              <span class="fw-semibold">${user.ordersCount || 0}</span>
            </div>
          </td>
          <td>
            ${user.lastOrder ? `<small>${formatDate(user.lastOrder.createdAt)}</small>` : '<small>-</small>'}
          </td>
          <td><small>${formatDate(user.createdAt)}</small></td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-light" data-action="view">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-primary" data-action="edit">
                <i class="fas fa-pen"></i>
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

  function parseSort(sortValue) {
    if (!sortValue || !sortValue.includes(':')) {
      return { sortBy: 'createdAt', sortOrder: 'desc' };
    }
    const [sortBy, sortOrder] = sortValue.split(':');
    return { sortBy, sortOrder };
  }

  async function fetchUsers(page = 1) {
    if (!await ensureAuthReady()) {
      window.location.href = '/login';
      return;
    }

    try {
      const { sortBy, sortOrder } = parseSort(filters.sortValue || 'createdAt:desc');
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_LIMIT.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.role) params.append('role', filters.role);
      if (filters.verified) params.append('verified', filters.verified);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${getApiBaseUrl()}/users/admin?${params.toString()}`, {
        headers: window.auth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('No se pudieron obtener los usuarios');
      }

      const data = await response.json();
      rawUsers = Array.isArray(data.users) ? data.users : [];
      pagination = data.pagination || pagination;
      stats = data.stats || stats;

      renderStats();
      renderUsers();
      renderPagination();
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      if (window.admin?.showNotification) {
        window.admin.showNotification('No se pudieron cargar los usuarios. Intenta nuevamente.', 'danger');
      }
    }
  }

  function parseAddress(address) {
    if (!address) return '';
    if (typeof address === 'string') return address;
    try {
      return JSON.stringify(address, null, 2);
    } catch {
      return '';
    }
  }

  function safeJsonParse(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function populateModal(user) {
    if (!user) return;

    selectedUser = user;
    elements.modalUserId.value = user.id;
    elements.modalFirstName.value = ensureString(user.firstName);
    elements.modalLastName.value = ensureString(user.lastName);
    elements.modalEmail.value = ensureString(user.email);
    elements.modalPhone.value = ensureString(user.phone);
    elements.modalRut.value = ensureString(user.rut);
    elements.modalRole.value = user.role || 'user';
    elements.modalAddress.value = parseAddress(user.address);
    elements.modalVerified.checked = !!user.isVerified;
    elements.modalOrdersCount.textContent = user.ordersCount || 0;
    elements.modalLastOrder.textContent = user.lastOrder ? `${formatDate(user.lastOrder.createdAt)} · $${user.lastOrder.total?.toLocaleString('es-CL') || 0}` : 'Sin pedidos recientes';
    elements.modalCreatedAt.textContent = formatDate(user.createdAt);
  }

  async function updateUser() {
    if (!selectedUser) return;

    const payload = {
      firstName: ensureString(elements.modalFirstName.value).trim() || null,
      lastName: ensureString(elements.modalLastName.value).trim() || null,
      phone: ensureString(elements.modalPhone.value).trim() || null,
      rut: ensureString(elements.modalRut.value).trim() || null,
      role: elements.modalRole.value,
      isVerified: elements.modalVerified.checked
    };

    const addressValue = ensureString(elements.modalAddress.value).trim();
    if (addressValue) {
      const parsedAddress = safeJsonParse(addressValue);
      if (!parsedAddress) {
        if (window.admin?.showNotification) {
          window.admin.showNotification('El formato de la dirección debe ser JSON válido.', 'warning');
        }
        return;
      }
      payload.address = parsedAddress;
    } else {
      payload.address = null;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/admin/${selectedUser.id}`, {
        method: 'PUT',
        headers: window.auth.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo actualizar el usuario');
      }

      if (window.admin?.showNotification) {
        window.admin.showNotification('Usuario actualizado correctamente.', 'success');
      }

      if (userModalInstance) {
        userModalInstance.hide();
      }

      await fetchUsers(pagination.page);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      if (window.admin?.showNotification) {
        window.admin.showNotification(error.message || 'No se pudo actualizar el usuario.', 'danger');
      }
    }
  }

  async function deleteUser() {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/admin/${selectedUser.id}`, {
        method: 'DELETE',
        headers: window.auth.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo eliminar el usuario');
      }

      if (window.admin?.showNotification) {
        window.admin.showNotification('Usuario eliminado correctamente.', 'success');
      }

      if (deleteModalInstance) {
        deleteModalInstance.hide();
      }

      if (userModalInstance) {
        userModalInstance.hide();
      }

      await fetchUsers(1);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      if (window.admin?.showNotification) {
        window.admin.showNotification(error.message || 'No se pudo eliminar el usuario.', 'danger');
      }
    }
  }

  function attachEventListeners() {
    if (elements.pagination) {
      elements.pagination.addEventListener('click', event => {
        const target = event.target.closest('[data-page]');
        if (!target) return;
        const page = parseInt(target.getAttribute('data-page'), 10);
        if (Number.isNaN(page) || page < 1 || page > pagination.pages || page === pagination.page) return;
        fetchUsers(page);
      });
    }

    if (elements.tableBody) {
      elements.tableBody.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const row = button.closest('tr[data-user-id]');
        const userId = row?.getAttribute('data-user-id');
        const user = rawUsers.find(u => u.id === userId);
        if (!user) return;

        populateModal(user);
        if (!userModalInstance) {
          userModalInstance = bootstrap.Modal.getOrCreateInstance(elements.modal);
        }
        userModalInstance.show();
      });
    }

    if (elements.clearFiltersBtn) {
      elements.clearFiltersBtn.addEventListener('click', () => {
        filters = {
          role: '',
          verified: '',
          search: '',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          sortValue: 'createdAt:desc'
        };
        elements.roleFilter.value = '';
        elements.verifiedFilter.value = '';
        elements.searchFilter.value = '';
        elements.sortFilter.value = 'createdAt:desc';
        fetchUsers(1);
      });
    }

    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', () => {
        fetchUsers(pagination.page);
      });
    }

    if (elements.roleFilter) {
      elements.roleFilter.addEventListener('change', event => {
        filters.role = event.target.value;
        fetchUsers(1);
      });
    }

    if (elements.verifiedFilter) {
      elements.verifiedFilter.addEventListener('change', event => {
        filters.verified = event.target.value;
        fetchUsers(1);
      });
    }

    if (elements.sortFilter) {
      elements.sortFilter.addEventListener('change', event => {
        filters.sortValue = event.target.value;
        fetchUsers(1);
      });
    }

    const debounce = (fn, delay = 300) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    };

    if (elements.searchFilter) {
      elements.searchFilter.addEventListener('input', debounce(event => {
        filters.search = event.target.value.trim();
        fetchUsers(1);
      }, 300));
    }

    if (elements.modalSaveBtn) {
      elements.modalSaveBtn.addEventListener('click', updateUser);
    }

    if (elements.modalDeleteBtn) {
      elements.modalDeleteBtn.addEventListener('click', () => {
        if (!deleteModalInstance) {
          deleteModalInstance = bootstrap.Modal.getOrCreateInstance(elements.confirmDeleteModal);
        }
        deleteModalInstance.show();
      });
    }

    if (elements.confirmDeleteBtn) {
      elements.confirmDeleteBtn.addEventListener('click', deleteUser);
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

    if (elements.adminName && window.auth.user) {
      elements.adminName.textContent = `${window.auth.user.firstName || ''} ${window.auth.user.lastName || ''}`.trim() || window.auth.user.email;
    }

    attachEventListeners();
    fetchUsers(1);
  });
})();

