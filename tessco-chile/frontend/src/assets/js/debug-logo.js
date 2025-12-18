// debug-logo.js - Script de depuración para el logo

console.log('🔍 Debug del logo iniciado...');

// Verificar si window.config está disponible
console.log('window.config disponible:', !!window.config);
if (window.config) {
  console.log('Config API URL:', window.config.apiBaseUrl);
  console.log('Config endpoints:', window.config.endpoints);
}

// Verificar si auth está disponible
console.log('auth disponible:', !!window.auth);
if (window.auth) {
  console.log('Auth token disponible:', !!window.auth.token);
}

// Verificar si imageManager está disponible
console.log('imageManager disponible:', !!window.imageManager);

// Verificar si logoLoader está disponible
console.log('logoLoader disponible:', !!window.logoLoader);

// Intentar cargar el logo actual manualmente
async function debugLoadLogo() {
  try {
    console.log('🔍 Intentando cargar logo actual...');
    
    if (!window.auth || !window.auth.token) {
      console.error('❌ No hay token de autenticación');
      return;
    }

    const apiUrl = window.config ? window.config.getApiUrl(window.config.endpoints.upload) : 'http://localhost:4000/api/upload';
    console.log('API URL:', apiUrl);

    const response = await fetch(`${apiUrl}/logo`, {
      headers: {
        'Authorization': `Bearer ${window.auth.token}`
      }
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Logo data:', data);
      
      if (data.data && data.data.logo) {
        const logoUrl = window.config ? window.config.getImageUrl(data.data.logo) : 'http://localhost:4000' + data.data.logo;
        console.log('Logo URL:', logoUrl);
        
        // Intentar cargar la imagen
        const img = new Image();
        img.onload = () => {
          console.log('✅ Logo cargado correctamente');
          // Actualizar el logo en la página
          const currentLogoDiv = document.getElementById('currentLogo');
          if (currentLogoDiv) {
            currentLogoDiv.innerHTML = `
              <div class="text-center">
                <img src="${logoUrl}" class="img-fluid" style="max-height: 100px;" alt="Logo actual">
                <div class="mt-2">
                  <button class="btn btn-danger btn-sm" onclick="imageManager.deleteLogo()">
                    <i class="fas fa-trash me-1"></i>Eliminar Logo
                  </button>
                </div>
              </div>
            `;
          }
        };
        img.onerror = () => {
          console.error('❌ Error cargando la imagen del logo');
        };
        img.src = logoUrl;
      } else {
        console.log('No hay logo configurado');
      }
    } else {
      console.error('❌ Error en la respuesta:', response.status);
    }
  } catch (error) {
    console.error('❌ Error cargando logo:', error);
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 DOM cargado, ejecutando debug...');
  // Esperar a que todos los scripts se carguen
  setTimeout(() => {
    console.log('🔍 Verificando disponibilidad de objetos...');
    console.log('auth disponible:', !!window.auth);
    console.log('imageManager disponible:', !!window.imageManager);
    console.log('logoLoader disponible:', !!window.logoLoader);
    
    if (window.auth && window.imageManager && window.logoLoader) {
      console.log('✅ Todos los objetos están disponibles, ejecutando debug...');
      debugLoadLogo();
    } else {
      console.log('⏳ Esperando a que se carguen los objetos...');
      console.log('auth:', !!window.auth);
      console.log('imageManager:', !!window.imageManager);
      console.log('logoLoader:', !!window.logoLoader);
      setTimeout(debugLoadLogo, 3000); // Esperar 3 segundos más
    }
  }, 1000);
});

// Hacer la función global para poder llamarla desde la consola
window.debugLoadLogo = debugLoadLogo;
