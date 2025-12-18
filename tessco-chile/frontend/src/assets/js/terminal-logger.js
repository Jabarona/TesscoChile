// terminal-logger.js - Enviar logs del frontend a la terminal del servidor

class TerminalLogger {
  constructor() {
    this.enabled = true;
    this.apiUrl = window.location.origin;
  }

  // Enviar log al servidor
  async sendLog(level, message, data = null) {
    if (!this.enabled) return;

    try {
      await fetch(`${this.apiUrl}/api/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      });
    } catch (error) {
      // Silenciar errores para evitar bucles infinitos
      console.warn('No se pudo enviar log al servidor:', error.message);
    }
  }

  // Métodos de logging
  log(message, data = null) {
    console.log(message, data);
    this.sendLog('log', message, data);
  }

  info(message, data = null) {
    console.info(message, data);
    this.sendLog('info', message, data);
  }

  warn(message, data = null) {
    console.warn(message, data);
    this.sendLog('warn', message, data);
  }

  error(message, data = null) {
    console.error(message, data);
    this.sendLog('error', message, data);
  }

  success(message, data = null) {
    console.log(`✅ ${message}`, data);
    this.sendLog('success', message, data);
  }

  auth(message, data = null) {
    console.log(`🔐 ${message}`, data);
    this.sendLog('auth', message, data);
  }

  debug(message, data = null) {
    console.log(`🐛 ${message}`, data);
    this.sendLog('debug', message, data);
  }

  // Habilitar/deshabilitar
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Crear instancia global
window.terminalLogger = new TerminalLogger();

// Función de conveniencia para reemplazar console.log
window.tlog = window.terminalLogger;

// Test inicial
console.log('🔧 Terminal Logger cargado');
window.terminalLogger.success('Terminal Logger inicializado correctamente');

// Test de conectividad
setTimeout(() => {
  window.terminalLogger.info('Test de conectividad con el servidor');
}, 2000);
