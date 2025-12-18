// Configuración global de variables de entorno para el frontend
// Edita este archivo para ajustar las URLs por entorno sin tocar cada página.
(function loadEnvConfig() {
  if (typeof window === 'undefined') {
    return;
  }

  const defaults = {
    API_BASE_URL: 'http://localhost:4000',
    FRONTEND_URL: 'http://localhost:3000'
  };

  const hostConfigs = {
    'localhost': {
      API_BASE_URL: 'https://giraldosa-tessco-chile-production.up.railway.app',
      FRONTEND_URL: 'http://localhost:3000'
    },
    '127.0.0.1': {
      API_BASE_URL: 'https://giraldosa-tessco-chile-production.up.railway.app',
      FRONTEND_URL: 'http://localhost:3000'
    },
    'beta.tesscochile.cl': {
      API_BASE_URL: 'https://giraldosa-tessco-chile-production.up.railway.app',
      FRONTEND_URL: 'https://beta.tesscochile.cl'
    }
  };

  const hostname = window.location.hostname || '';
  const normalizedHost = hostname.replace(/^www\./, '');
  const hostOverride = hostConfigs[hostname] || hostConfigs[normalizedHost] || {};

  window.ENV = Object.assign({}, defaults, hostOverride, window.ENV || {});
})();

