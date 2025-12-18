// image-manager.js - Gestión de imágenes para Tessco Chile

class ImageManager {
  constructor() {
    this.currentFolder = 'products';
    this.uploadedFiles = [];
    this.logoFile = null;
    this.initApiUrl();
  }

  // Inicializar URL de la API
  initApiUrl() {
    if (window.config && window.config.getApiUrl) {
      this.apiUrl = window.config.getApiUrl(window.config.endpoints.upload);
    } else {
      this.apiUrl = 'http://localhost:4000/api/upload';
    }
    console.log('🔧 ImageManager API URL:', this.apiUrl);
  }

  // Mostrar alertas
  showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alertContainer') || this.createAlertContainer();
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
  }

  createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'position-fixed top-0 start-50 translate-middle-x mt-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  }

  // Configurar drag & drop
  setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach(area => {
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
      });

      area.addEventListener('dragleave', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
      });

      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files, area.id.replace('UploadArea', ''));
      });

      area.addEventListener('click', (e) => {
        const input = area.querySelector('input[type="file"]');
        if (input) {
          input.click();
        }
      });
    });

    // Configurar inputs de archivo
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const folder = e.target.id.replace('Input', '');
        this.handleFiles(files, folder);
      });
    });
  }

  // Manejar archivos seleccionados
  async handleFiles(files, folder) {
    if (files.length === 0) return;

    // Validar archivos
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        this.showAlert('Solo se permiten archivos de imagen', 'warning');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('El archivo es demasiado grande (máximo 5MB)', 'warning');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Manejo especial para el logo: solo previsualizar y esperar confirmación
    if (folder === 'logo' || folder === 'logoFile') {
      const logoFile = validFiles[0];
      this.logoFile = logoFile;
      this.previewLogo(logoFile);
      return;
    }

    // Mostrar preview
    this.showPreview(validFiles, folder);

    // Subir archivos
    await this.uploadFiles(validFiles, folder);
  }

  // Mostrar preview de imágenes
  showPreview(files, folder) {
    const previewContainer = document.getElementById(`${folder}Preview`);
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'col-md-3 mb-3';
        previewDiv.innerHTML = `
          <div class="image-item position-relative">
            <img src="${e.target.result}" class="img-fluid image-preview" alt="Preview">
            <div class="image-actions">
              <button class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="mt-2">
              <small class="text-muted">${file.name}</small>
              <br>
              <small class="text-muted">${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
          </div>
        `;
        previewContainer.appendChild(previewDiv);
      };
      reader.readAsDataURL(file);
    });
  }

  // Subir archivos al servidor
  async uploadFiles(files, folder) {
    try {
      const formData = new FormData();
      
      if (folder === 'products' && files.length > 1) {
        // Múltiples imágenes para productos
        files.forEach(file => {
          formData.append('images', file);
        });
      } else {
        // Una sola imagen
        formData.append('image', files[0]);
      }

      const endpoint = folder === 'products' && files.length > 1 ? 'products' : folder;
      const response = await fetch(`${this.apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        this.showAlert(data.message, 'success');
        // Limpiar preview
        const previewContainer = document.getElementById(`${folder}Preview`);
        if (previewContainer) {
          previewContainer.innerHTML = '';
        }
        // Recargar galería
        this.loadImages(folder);
      } else {
        this.showAlert(data.message || 'Error subiendo imágenes', 'danger');
      }
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      this.showAlert('Error de conexión. Intenta nuevamente.', 'danger');
    }
  }

  // Cargar imágenes de una carpeta
  async loadImages(folder) {
    try {
      this.currentFolder = folder;
      const response = await fetch(`${this.apiUrl}/list/${folder}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        this.displayImages(data.data.images, folder);
      } else {
        this.showAlert(data.message || 'Error cargando imágenes', 'danger');
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      this.showAlert('Error de conexión. Intenta nuevamente.', 'danger');
    }
  }

  // Mostrar imágenes en la galería
  displayImages(images, folder) {
    const gallery = document.getElementById('imagesGallery');
    if (!gallery) return;

    if (images.length === 0) {
      gallery.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <i class="fas fa-image fa-3x mb-3"></i>
          <p>No hay imágenes en esta carpeta</p>
        </div>
      `;
      return;
    }

    gallery.innerHTML = '';

    images.forEach(image => {
      const imageDiv = document.createElement('div');
      imageDiv.className = 'col-md-3 mb-3';
      imageDiv.innerHTML = `
        <div class="image-item position-relative">
          <img src="${window.config ? window.config.getImageUrl(image.thumbnail) : 'http://localhost:4000' + image.thumbnail}" 
               class="img-fluid image-preview" 
               alt="${image.filename}"
               onclick="imageManager.showImageModal('${image.original}', '${image.filename}')">
          <div class="image-actions">
            <button class="btn btn-sm btn-danger" onclick="imageManager.deleteImage('${folder}', '${image.filename}')">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn btn-sm btn-info" onclick="imageManager.copyImageUrl('${image.original}')">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="mt-2">
            <small class="text-muted d-block">${image.filename}</small>
            <small class="text-muted">${(image.size / 1024 / 1024).toFixed(2)} MB</small>
          </div>
        </div>
      `;
      gallery.appendChild(imageDiv);
    });
  }

  // Eliminar imagen
  async deleteImage(folder, filename) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${folder}/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        this.showAlert(data.message, 'success');
        this.loadImages(folder);
      } else {
        this.showAlert(data.message || 'Error eliminando imagen', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      this.showAlert('Error de conexión. Intenta nuevamente.', 'danger');
    }
  }

  // Copiar URL de imagen
  copyImageUrl(url) {
    const fullUrl = window.config ? window.config.getImageUrl(url) : 'http://localhost:4000' + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.showAlert('URL copiada al portapapeles', 'success');
    }).catch(() => {
      this.showAlert('Error copiando URL', 'danger');
    });
  }

  // Mostrar modal con imagen
  showImageModal(imageUrl, filename) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content bg-dark">
          <div class="modal-header">
            <h5 class="modal-title text-white">${filename}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img src="${window.config ? window.config.getImageUrl(imageUrl) : 'http://localhost:4000' + imageUrl}" class="img-fluid" alt="${filename}">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="imageManager.copyImageUrl('${imageUrl}')">
              <i class="fas fa-copy me-2"></i>Copiar URL
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modal);
    });
  }

  // ==================== MÉTODOS DEL LOGO ====================

  // Cargar logo actual
  async loadCurrentLogo() {
    try {
      const response = await fetch(`${this.apiUrl}/logo`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.displayCurrentLogo(data.data.logo);
      } else {
        this.displayCurrentLogo(null);
      }
    } catch (error) {
      console.error('Error cargando logo actual:', error);
      this.displayCurrentLogo(null);
    }
  }

  // Mostrar logo actual
  displayCurrentLogo(logo) {
    const currentLogoDiv = document.getElementById('currentLogo');
    if (!currentLogoDiv) return;

    if (logo) {
      const logoUrl = window.config ? window.config.getImageUrl(logo) : 'http://localhost:4000' + logo;
      currentLogoDiv.innerHTML = `
        <div class="text-center">
          <img src="${logoUrl}" class="img-fluid logo-img" alt="Logo actual">
          <div class="mt-3">
            <button class="btn btn-danger btn-sm" onclick="imageManager.deleteLogo()">
              <i class="fas fa-trash me-1"></i>Eliminar Logo
            </button>
          </div>
        </div>
      `;
    } else {
      currentLogoDiv.innerHTML = `
        <div class="text-center text-muted">
          <i class="fas fa-image fa-2x mb-2"></i>
          <p>No hay logo configurado</p>
        </div>
      `;
    }
  }

  // Configurar eventos del logo
  setupLogoEvents() {
    const logoFileInput = document.getElementById('logoFileInput');
    if (logoFileInput) {
      logoFileInput.addEventListener('change', (e) => {
        this.handleLogoFileSelect(e);
      });
    }
  }

  // Manejar selección de archivo de logo
  handleLogoFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.showAlert('Por favor selecciona un archivo de imagen válido', 'danger');
      return;
    }

    // Validar tamaño (máximo 2MB para logo)
    if (file.size > 2 * 1024 * 1024) {
      this.showAlert('El logo debe ser menor a 2MB', 'danger');
      return;
    }

    this.logoFile = file;
    this.previewLogo(file);
  }

  // Preview del logo
  previewLogo(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('logoPreviewImg');
      const previewDiv = document.getElementById('logoPreview');
      
      if (previewImg && previewDiv) {
        previewImg.src = e.target.result;
        previewDiv.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }

  // Subir logo
  async uploadLogo() {
    if (!this.logoFile) {
      this.showAlert('Por favor selecciona un archivo de logo', 'danger');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logo', this.logoFile);

      const response = await fetch(`${this.apiUrl}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        this.showAlert('Logo actualizado exitosamente', 'success');
        this.cancelLogoUpload();
        this.loadCurrentLogo();
        this.updateAllLogos(data.data.logo);
      } else {
        this.showAlert(data.message || 'Error subiendo logo', 'danger');
      }
    } catch (error) {
      console.error('Error subiendo logo:', error);
      this.showAlert('Error de conexión. Intenta nuevamente.', 'danger');
    }
  }

  // Cancelar upload de logo
  cancelLogoUpload() {
    this.logoFile = null;
    const logoFileInput = document.getElementById('logoFileInput');
    const previewDiv = document.getElementById('logoPreview');
    
    if (logoFileInput) logoFileInput.value = '';
    if (previewDiv) previewDiv.style.display = 'none';
  }

  // Eliminar logo
  async deleteLogo() {
    if (!confirm('¿Estás seguro de que quieres eliminar el logo?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        this.showAlert('Logo eliminado exitosamente', 'success');
        this.loadCurrentLogo();
        this.updateAllLogos(null);
      } else {
        const data = await response.json();
        this.showAlert(data.message || 'Error eliminando logo', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando logo:', error);
      this.showAlert('Error de conexión. Intenta nuevamente.', 'danger');
    }
  }

  // Actualizar todos los logos en la página
  updateAllLogos(logoPath) {
    // Usar el logo-loader si está disponible
    if (window.logoLoader) {
      window.logoLoader.setLogo(logoPath);
    } else {
      // Fallback manual
      const logoElements = document.querySelectorAll('.logo-img, .navbar-brand img, .footer-logo img');
      const logoUrl = logoPath ? 
        (window.config ? window.config.getImageUrl(logoPath) : 'http://localhost:4000' + logoPath) : 
        null;

      logoElements.forEach(element => {
        if (logoUrl) {
          element.src = logoUrl;
          element.style.display = 'block';
          // Aplicar estilos específicos según el tipo de logo
          this.applyLogoStyles(element);
        } else {
          element.style.display = 'none';
        }
      });

      // Guardar en localStorage para persistencia
      if (logoPath) {
        localStorage.setItem('companyLogo', logoPath);
      } else {
        localStorage.removeItem('companyLogo');
      }
    }
  }

  // Aplicar estilos específicos según el tipo de logo
  applyLogoStyles(element) {
    // Resetear estilos
    element.style.maxWidth = '';
    element.style.maxHeight = '';
    element.style.width = '';
    element.style.height = '';
    element.style.objectFit = '';
    element.style.objectPosition = '';

    // Determinar el tipo de logo basado en las clases y contexto
    const isNavbarLogo = element.closest('.navbar-brand') || element.classList.contains('navbar-brand');
    const isFooterLogo = element.closest('.footer-logo') || element.classList.contains('footer-logo');
    const isHeaderLogo = element.closest('.header-logo') || element.classList.contains('header-logo');

    if (isNavbarLogo || isHeaderLogo) {
      // Logo del header - más pequeño y alineado a la izquierda
      element.style.maxHeight = '40px';
      element.style.maxWidth = '150px';
      element.style.width = 'auto';
      element.style.height = 'auto';
      element.style.objectFit = 'contain';
      element.style.objectPosition = 'left center';
    } else if (isFooterLogo) {
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
}

// Instancia global
const imageManager = new ImageManager();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que la configuración esté disponible
  setTimeout(() => {
    imageManager.initApiUrl();
    imageManager.setupDragAndDrop();
    imageManager.setupLogoEvents();
    imageManager.loadCurrentLogo();
    window.imageManager = imageManager; // Hacer disponible globalmente
    console.log('🔧 ImageManager inicializado');
  }, 500);
});

// Función global para cargar imágenes
function loadImages(folder) {
  imageManager.loadImages(folder);
}
