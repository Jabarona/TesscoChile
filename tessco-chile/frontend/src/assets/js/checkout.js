// Checkout - Tessco Chile
// Multi-step checkout process

const API_BASE_URL = (window.config && window.config.apiBaseUrl) || window.API_URL || 'http://localhost:4000';
window.API_URL = API_BASE_URL;

let currentStep = 1;
const totalSteps = 3;
let selectedDeliveryMethod = null;
let selectedPropertyType = null;
let currentShippingCost = 0;
let mercadoPagoInstance = null;
let mercadoPagoMode = 'test';

// Estos valores se cargarán desde la API
let FREE_SHIPPING_THRESHOLD = 50000;
let HOME_DELIVERY_COST = 5000;

const PAYMENT_POLL_INTERVAL = 4000;
const PAYMENT_MAX_ATTEMPTS = 180;
const PAYMENT_CONFIRMATION_INTERVAL = 3;
const PAYMENT_FINAL_CONFIRMATION_RETRIES = 3;

let checkoutSubmitButtonState = null;
let paymentMonitorInterval = null;
let lastOrderData = null;

// Cargar configuración de envío desde la API
async function loadShippingSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings`);
    if (response.ok) {
      const data = await response.json();
      const settings = data.data || {};
      
      if (settings.shippingCost) {
        HOME_DELIVERY_COST = parseFloat(settings.shippingCost) || 5000;
      }
      if (settings.freeShippingThreshold) {
        FREE_SHIPPING_THRESHOLD = parseFloat(settings.freeShippingThreshold) || 50000;
      }
      
      console.log('📦 Configuración de envío cargada:', {
        shippingCost: HOME_DELIVERY_COST,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD
      });
    }
  } catch (error) {
    console.warn('⚠️ No se pudo cargar la configuración de envío, usando valores por defecto:', error);
  }
}

// Initialize checkout
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🛒 Inicializando checkout...');
  
  // Cargar configuración de envío
  await loadShippingSettings();
  
  initializeCheckout();
  loadCartData();
  setupEventListeners();
  initializeMercadoPagoConfig();
  
  // Intentar auto-llenar con múltiples estrategias
  tryAutoFill();
  
  // Escuchar eventos de auth
  window.addEventListener('auth:login', () => {
    console.log('🔔 Evento auth:login detectado, auto-llenando...');
    autoFillUserData();
  });
});

// Intentar auto-llenar con reintentos
function tryAutoFill() {
  let attempts = 0;
  const maxAttempts = 10;
  
  const attemptAutoFill = () => {
    attempts++;
    console.log(`🔄 Intento ${attempts} de auto-llenar datos...`);
    
    if (window.auth && window.auth.isAuthenticated() && window.auth.user) {
      console.log('✅ Auth listo, auto-llenando datos');
      autoFillUserData();
      return;
    }
    
    if (attempts < maxAttempts) {
      setTimeout(attemptAutoFill, 200);
    } else {
      console.log('⚠️ No se pudo auto-llenar después de', maxAttempts, 'intentos');
    }
  };
  
  attemptAutoFill();
}

// Initialize checkout functionality
function initializeCheckout() {
  // Show first step
  showStep(1);
  
  // Setup RUT formatting
  const rutInput = document.getElementById('rut');
  if (rutInput) {
    rutInput.addEventListener('input', formatRUT);
  }
  
  // Setup phone formatting
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', formatPhone);
  }
}

// Load cart data from localStorage
function loadCartData() {
  const cartItems = JSON.parse(localStorage.getItem('tessco_cart') || '[]');
  
  if (cartItems.length === 0) {
    window.location.href = '/cart';
    return;
  }

  renderOrderSummary(cartItems);
  updateTotals(cartItems);
}

// Initialize MercadoPago configuration
async function initializeMercadoPagoConfig() {
  if (!window.MercadoPago) {
    console.warn('⚠️ SDK de MercadoPago no disponible en la página.');
    return;
  }

  // No requiere autenticación - permitir carga de configuración para todos
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/mercadopago/config`);

    let data = {};
    try {
      data = await response.json();
    } catch (parseError) {
      console.warn('⚠️ Respuesta sin cuerpo desde configuración de MercadoPago.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo obtener la configuración de MercadoPago');
    }

    if (!data.publicKey) {
      throw new Error('No se recibió la clave pública de MercadoPago');
    }

    mercadoPagoMode = data.mode || 'test';
    mercadoPagoInstance = new MercadoPago(data.publicKey, {
      locale: data.locale || 'es-CL'
    });

    console.log(`✅ MercadoPago inicializado (${mercadoPagoMode})`);
  } catch (error) {
    console.error('❌ Error inicializando MercadoPago:', error);
    showNotification('No se pudo inicializar el método de pago de MercadoPago', 'warning');
  }
}

// Render order summary
function renderOrderSummary(items) {
  const container = document.getElementById('order-items');
  if (!container) return;
  
  container.innerHTML = items.map(item => `
    <div class="product-item">
      <img src="${item.imageUrl || '/uploads/products/default.jpg'}" 
           alt="${item.name}" 
           class="product-image"
           onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27%3E%3Crect width=%2760%27 height=%2760%27 fill=%27%23333%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27Arial%27 font-size=%2712%27 fill=%27%23999%27%3ENo Image%3C/text%3E%3C/svg%3E';">
      <div class="flex-grow-1">
        <h6 class="text-white mb-1">${item.name}</h6>
        <small class="text-muted">Cantidad: ${item.quantity}</small>
      </div>
      <div class="text-end">
        <p class="text-white mb-0">$${(item.price * item.quantity).toLocaleString('es-CL')}</p>
      </div>
    </div>
  `).join('');
}

// Update totals
function updateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let shipping = 0;

  if (selectedDeliveryMethod === 'home') {
    shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : HOME_DELIVERY_COST;
  }

  currentShippingCost = shipping;
  const total = subtotal + shipping;
  
  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');
  const checkoutTotalEl = document.getElementById('checkout-total');
  const summarySubtotalEl = document.getElementById('summary-subtotal');
  const summaryShippingEl = document.getElementById('summary-shipping');
  const summaryTotalEl = document.getElementById('summary-total');
  
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CL')}`;
  if (shippingEl) shippingEl.textContent = selectedDeliveryMethod === 'pickup' ? '¡Envío gratis!' : `$${shipping.toLocaleString('es-CL')}`;
  if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
  if (checkoutTotalEl) checkoutTotalEl.textContent = total.toLocaleString('es-CL');
  if (summarySubtotalEl) summarySubtotalEl.textContent = `$${subtotal.toLocaleString('es-CL')}`;
  if (summaryShippingEl) summaryShippingEl.textContent = selectedDeliveryMethod === 'pickup' ? '¡Gratis!' : `$${shipping.toLocaleString('es-CL')}`;
  if (summaryTotalEl) summaryTotalEl.textContent = `$${total.toLocaleString('es-CL')}`;
}

// Auto-fill user data if logged in
function autoFillUserData() {
  console.log('🔍 Verificando autenticación para auto-fill...');
  
  if (!window.auth) {
    console.log('⚠️ window.auth no está disponible');
    return;
  }
  
  if (!window.auth.isAuthenticated()) {
    console.log('ℹ️ Usuario no autenticado, no se auto-llenará');
    return;
  }
  
  const user = window.auth.user;
  console.log('👤 Usuario autenticado:', user);
  
  if (!user) {
    console.log('⚠️ No hay datos de usuario disponibles');
    return;
  }
  
  // Fill identification fields
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const rutInput = document.getElementById('rut');
  
  if (firstNameInput && user.firstName) firstNameInput.value = user.firstName;
  if (lastNameInput && user.lastName) lastNameInput.value = user.lastName;
  if (emailInput && user.email) emailInput.value = user.email;
  if (rutInput && user.rut) rutInput.value = user.rut;
  
  // Phone (remove +56 prefix if present)
  if (phoneInput && user.phone) {
    let phone = user.phone;
    if (phone.startsWith('+56')) {
      phone = phone.substring(3);
    }
    phoneInput.value = phone;
  }
  
  // Fill address fields if available
  if (user.address && typeof user.address === 'object') {
    console.log('📍 Auto-llenando dirección:', user.address);
    
    const regionInput = document.getElementById('region');
    const comunaInput = document.getElementById('comuna');
    const streetInput = document.getElementById('street');
    const streetNumberInput = document.getElementById('streetNumber');
    const additionalInfoInput = document.getElementById('additionalInfo');
    const aptNumberInput = document.getElementById('aptNumber');
    
    if (regionInput && user.address.region) regionInput.value = user.address.region;
    if (comunaInput && user.address.comuna) comunaInput.value = user.address.comuna;
    if (streetInput && user.address.street) streetInput.value = user.address.street;
    if (streetNumberInput && user.address.streetNumber) streetNumberInput.value = user.address.streetNumber;
    if (additionalInfoInput && user.address.additionalInfo) additionalInfoInput.value = user.address.additionalInfo;
    
    // Property type and apartment number
    if (user.address.propertyType) {
      selectPropertyType(user.address.propertyType);
    }
    
    if (aptNumberInput && user.address.apartmentNumber) {
      aptNumberInput.value = user.address.apartmentNumber;
    }
  }
  
  console.log('✅ Datos de usuario autollenados correctamente');
}

// Setup event listeners
function setupEventListeners() {
  // Delivery method selection
  document.querySelectorAll('.delivery-option').forEach(option => {
    option.addEventListener('click', function() {
      selectDeliveryMethod(this.dataset.delivery);
    });
  });
  
  // Property type selection
  document.querySelectorAll('.property-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectPropertyType(this.dataset.type);
    });
  });
  
  // Form submission
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', handleCheckoutSubmit);
  }
}

// Format RUT (Chilean ID)
function formatRUT(e) {
  let value = e.target.value.replace(/\./g, '').replace(/-/g, '');
  
  if (value.length <= 1) {
    e.target.value = value;
    return;
  }
  
  const dv = value.slice(-1);
  let rut = value.slice(0, -1);
  
  // Add thousands separators
  rut = rut.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  e.target.value = rut + '-' + dv;
}

// Format phone number
function formatPhone(e) {
  let value = e.target.value.replace(/\s/g, '');
  
  // Limit to 11 digits (9 XXXX XXXX)
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  
  // Add spaces for better readability
  if (value.length > 1) {
    value = value.replace(/(\d{1})(\d{4})(\d{0,4})/, '$1 $2 $3').trim();
  }
  
  e.target.value = value;
}

// Select delivery method
function selectDeliveryMethod(method) {
  selectedDeliveryMethod = method;
  
  // Update UI
  document.querySelectorAll('.delivery-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  document.querySelector(`[data-delivery="${method}"]`).classList.add('selected');
  
  // Show/hide relevant sections
  const storeInfo = document.getElementById('store-info');
  const addressFields = document.getElementById('address-fields');
  
  if (method === 'pickup') {
    storeInfo.classList.add('active');
    addressFields.classList.remove('active');
    
    // Clear address field requirements
    addressFields.querySelectorAll('input, select').forEach(field => {
      field.removeAttribute('required');
    });
  } else {
    storeInfo.classList.remove('active');
    addressFields.classList.add('active');
    
    // Add address field requirements
    addressFields.querySelectorAll('input[name="region"], input[name="comuna"], input[name="street"], input[name="streetNumber"]').forEach(field => {
      field.setAttribute('required', 'required');
    });
  }
  
  // Update shipping cost
  const cartItems = JSON.parse(localStorage.getItem('tessco_cart') || '[]');
  updateTotals(cartItems);
  
  console.log(`📦 Método de entrega seleccionado: ${method}`);
}

// Select property type
function selectPropertyType(type) {
  selectedPropertyType = type;
  
  // Update UI
  document.querySelectorAll('.property-type-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  
  // Show/hide apartment number field
  const aptNumberField = document.getElementById('apartmentNumber');
  const aptNumberInput = document.getElementById('aptNumber');
  
  if (type === 'apartment') {
    aptNumberField.classList.add('active');
    aptNumberInput.setAttribute('required', 'required');
      } else {
    aptNumberField.classList.remove('active');
    aptNumberInput.removeAttribute('required');
    aptNumberInput.value = '';
  }
  
  console.log(`🏠 Tipo de propiedad seleccionado: ${type}`);
}

// Show specific step
function showStep(step) {
  currentStep = step;
  
  // Hide all steps
  document.querySelectorAll('.step-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Show current step
  const currentStepContent = document.querySelector(`.step-content[data-step="${step}"]`);
  if (currentStepContent) {
    currentStepContent.classList.add('active');
  }
  
  // Update step indicator
  document.querySelectorAll('.step').forEach(stepEl => {
    const stepNum = parseInt(stepEl.dataset.step);
    stepEl.classList.remove('active', 'completed');
    
    if (stepNum === step) {
      stepEl.classList.add('active');
    } else if (stepNum < step) {
      stepEl.classList.add('completed');
    }
  });
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  console.log(`📍 Paso ${step} de ${totalSteps}`);
}

// Next step
function nextStep() {
  // Validate current step
  if (!validateStep(currentStep)) {
    return;
  }
  
  if (currentStep < totalSteps) {
    showStep(currentStep + 1);
  }
}

// Previous step
function prevStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

// Validate step
function validateStep(step) {
  const stepContent = document.querySelector(`.step-content[data-step="${step}"]`);
  if (!stepContent) return false;
  
  const requiredFields = stepContent.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
        isValid = false;
    } else {
      field.classList.remove('is-invalid');
    }
  });
  
  // Step-specific validation
  if (step === 1) {
    // Validate email format
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      email.classList.add('is-invalid');
      showNotification('Por favor ingresa un correo electrónico válido', 'danger');
      isValid = false;
    }

    // Validate phone (should be 9-11 digits)
    const phone = document.getElementById('phone');
    const phoneDigits = phone.value.replace(/\s/g, '');
    if (phoneDigits.length < 9) {
      phone.classList.add('is-invalid');
      showNotification('Por favor ingresa un teléfono válido', 'danger');
      isValid = false;
    }
  }
  
  if (step === 2) {
    // Validate delivery method selected
    if (!selectedDeliveryMethod) {
      showNotification('Por favor selecciona un método de entrega', 'danger');
      isValid = false;
    }
    
    // If home delivery, validate property type
    if (selectedDeliveryMethod === 'home' && !selectedPropertyType) {
      showNotification('Por favor selecciona el tipo de propiedad', 'danger');
      isValid = false;
    }
  }
  
  if (!isValid) {
    showNotification('Por favor completa todos los campos requeridos', 'danger');
  }
  
  return isValid;
}

// Handle checkout submission
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  if (!validateStep(3)) {
    return;
  }
  
  // Collect all form data
  const formData = collectFormData();
  let lastOrderData = null;
  
  console.log('📝 Datos del checkout:', formData);
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : '';

  checkoutSubmitButtonState = {
    button: submitBtn,
    originalText
  };

  try {
    // Mostrar feedback inmediato al usuario
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
    }
    
    // Mostrar mensaje de procesamiento inmediatamente
    const messages = document.getElementById('messages');
    if (messages) {
      messages.innerHTML = `
        <div class="info-message">
          <i class="fas fa-spinner fa-spin me-2"></i>
          <strong>Procesando tu pedido...</strong><br>
          <small>Por favor espera, esto puede tardar unos segundos.</small>
        </div>
      `;
    }
    
    // Obtener token si existe (opcional - permite compras sin autenticación)
    const token = localStorage.getItem('authToken');
    
    // Preparar headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Agregar token si existe (para usuarios autenticados)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Actualizar mensaje mientras se crea la orden
    if (messages) {
      messages.innerHTML = `
        <div class="info-message">
          <i class="fas fa-spinner fa-spin me-2"></i>
          <strong>Creando tu orden...</strong><br>
          <small>Estamos preparando tu pedido.</small>
        </div>
      `;
    }

    // Crear orden en backend (permite compras sin autenticación)
    const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(formData)
    });
    
    const orderResult = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(orderResult.error || 'Error al crear la orden');
    }
    
    // Guardar información de la orden para uso posterior
    lastOrderData = {
      id: orderResult.id,
      total: orderResult.total,
      status: orderResult.status,
      paymentStatus: orderResult.paymentStatus,
      paymentMethod: orderResult.paymentMethod || formData.payment?.method || 'mercadopago',
      createdAt: orderResult.createdAt,
      shippingAddress: orderResult.shippingAddress || null,
      items: Array.isArray(orderResult.items) && orderResult.items.length > 0
        ? orderResult.items
        : formData.items,
      summary: {
        subtotal: formData.subtotal,
        shipping: formData.shipping,
        total: formData.total
      },
      customer: formData.customer,
      delivery: formData.delivery,
      metadata: {
        source: 'checkout',
        savedAt: new Date().toISOString()
      }
    };

    localStorage.setItem('tessco_last_order', JSON.stringify(lastOrderData));

    // Actualizar mensaje mientras se crea la preferencia de pago
    if (messages) {
      messages.innerHTML = `
        <div class="info-message">
          <i class="fas fa-spinner fa-spin me-2"></i>
          <strong>Conectando con Mercado Pago...</strong><br>
          <small>Preparando tu método de pago seguro.</small>
        </div>
      `;
    }

    // Obtener preferencia de MercadoPago (permite sin autenticación)
    const preferenceResponse = await fetch(`${API_BASE_URL}/api/payments/mercadopago/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId: orderResult.id })
    });

    const preferenceResult = await preferenceResponse.json();

    if (!preferenceResponse.ok) {
      throw new Error(preferenceResult.error || 'Error al iniciar el pago con MercadoPago');
    }

    mercadoPagoMode = preferenceResult.mode || mercadoPagoMode;

    if (lastOrderData) {
      lastOrderData = {
        ...lastOrderData,
        payment: {
          provider: 'mercadopago',
          preferenceId: preferenceResult.preferenceId || null,
          paymentId: null,
          initPoint: preferenceResult.initPoint || null,
          sandboxInitPoint: preferenceResult.sandboxInitPoint || null,
          mode: preferenceResult.mode || mercadoPagoMode
        }
      };

      localStorage.setItem('tessco_last_order', JSON.stringify(lastOrderData));
    }

    const redirectUrl = mercadoPagoMode === 'test'
      ? preferenceResult.sandboxInitPoint || preferenceResult.initPoint
      : preferenceResult.initPoint || preferenceResult.sandboxInitPoint;

    if (!redirectUrl) {
      throw new Error('No se pudo obtener la URL de pago de MercadoPago');
    }

    console.log('🔗 Abriendo MercadoPago...', redirectUrl);

    // Guardar información de la orden en sessionStorage para poder recuperarla
    // en caso de que el usuario regrese directamente desde Mercado Pago
    sessionStorage.setItem('pendingPayment', JSON.stringify({
      orderId: orderResult.id,
      preferenceId: preferenceResult.preferenceId,
      timestamp: Date.now()
    }));

    // Abrir la ventana de Mercado Pago inmediatamente
    let paymentWindow = window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    
    // Mostrar mensaje de procesamiento después de abrir la ventana
    showPaymentProcessingMessage();

    // Verificar si el pop-up fue bloqueado o no se abrió
    let popupBlocked = false;
    if (!paymentWindow) {
      popupBlocked = true;
    } else {
      // Verificar después de un breve delay si la ventana se cerró inmediatamente
      setTimeout(() => {
        if (paymentWindow.closed) {
          popupBlocked = true;
          console.warn('⚠️ La ventana de pago se cerró inmediatamente. El navegador puede haber bloqueado el pop-up.');
          handlePopupBlocked(redirectUrl, orderResult.id, preferenceResult);
        }
      }, 500);
    }

    if (popupBlocked) {
      handlePopupBlocked(redirectUrl, orderResult.id, preferenceResult);
      return;
    }

    paymentWindow.focus();
    updateProcessingMessageForOpenedWindow();

    startMercadoPagoMonitoring({
      orderId: orderResult.id,
      paymentWindow,
      preference: preferenceResult,
      manualConfirmation: false
    });
    
  } catch (error) {
    console.error('❌ Error en checkout:', error);
    showNotification(error.message || 'Error al procesar la compra', 'danger');
    
    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}

// Collect form data
function collectFormData() {
  const cartItems = JSON.parse(localStorage.getItem('tessco_cart') || '[]');
  
  const data = {
    // Identification
    customer: {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: '+56' + document.getElementById('phone').value.replace(/\s/g, ''),
      rut: document.getElementById('rut').value.trim() || null
    },
    
    // Delivery
    delivery: {
      method: selectedDeliveryMethod || 'pickup',
      cost: currentShippingCost
    },
    
    // Payment
    payment: {
      method: 'mercadopago'
    },
    
    // Items
    items: cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    
    // Totals
    subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    shipping: currentShippingCost
  };
  
  // Add delivery address if home delivery
  if (selectedDeliveryMethod === 'home') {
    data.delivery.address = {
      region: document.getElementById('region').value,
      comuna: document.getElementById('comuna').value,
      street: document.getElementById('street').value,
      streetNumber: document.getElementById('streetNumber').value,
      propertyType: selectedPropertyType,
      apartmentNumber: selectedPropertyType === 'apartment' ? document.getElementById('aptNumber').value : null,
      additionalInfo: document.getElementById('additionalInfo').value.trim() || null
    };
  }
  
  data.total = data.subtotal + data.shipping;
  
  return data;
}

// Show notification
function showNotification(message, type = 'info') {
  if (window.cartOffcanvas && window.cartOffcanvas.showNotification) {
    window.cartOffcanvas.showNotification(message, type);
  } else if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

function showPaymentProcessingMessage() {
  const messages = document.getElementById('messages');
  if (!messages) return;

  messages.innerHTML = `
    <div class="info-message">
      <strong>Estamos procesando tu pago con MercadoPago.</strong><br>
      Se abrió una nueva pestaña para completar el pago. Una vez finalices, vuelve a esta ventana para ver la confirmación.
    </div>
  `;
}

function updateProcessingMessageForOpenedWindow() {
  const messages = document.getElementById('messages');
  if (!messages) return;

  messages.innerHTML = `
    <div class="info-message">
      <strong>Paso 1:</strong> Completa tu pago en la pestaña de MercadoPago que se abrió.<br>
      <strong>Paso 2:</strong> Cuando el pago termine, vuelve a esta ventana. Te redirigiremos automáticamente al resumen.
    </div>
  `;
}

function showPopupBlockedMessage(redirectUrl) {
  const messages = document.getElementById('messages');
  if (!messages) return;

  messages.innerHTML = `
    <div class="info-message">
      <strong>No pudimos abrir MercadoPago automáticamente.</strong><br>
      Por favor haz clic en el siguiente botón para continuar con el pago.<br>
      <button id="open-mercadopago" class="btn btn-primary mt-3">Ir a MercadoPago</button>
    </div>
  `;

  const openBtn = document.getElementById('open-mercadopago');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const manualWindow = window.open(redirectUrl, '_blank', 'noopener');
      if (!manualWindow || manualWindow.closed) {
        alert('Asegúrate de permitir pop-ups para continuar con el pago.');
        return;
      }

      manualWindow.focus();
      updateProcessingMessageForOpenedWindow();

      startMercadoPagoMonitoring({
        orderId: lastOrderData?.id,
        paymentWindow: manualWindow,
        preference: {
          preferenceId: lastOrderData?.payment?.preferenceId || null,
          paymentId: lastOrderData?.payment?.paymentId || null,
          mode: lastOrderData?.payment?.mode || mercadoPagoMode
        },
        manualConfirmation: true
      });
    }, { once: true });
  }
}

function clearPaymentProcessingMessage() {
  const messages = document.getElementById('messages');
  if (!messages) return;
  messages.innerHTML = '';
}

// Función para manejar cuando el pop-up está bloqueado
function handlePopupBlocked(redirectUrl, orderId, preference) {
  console.warn('⚠️ El navegador bloqueó el pop-up o no se pudo abrir en nueva pestaña.');
  
  // Mostrar mensaje al usuario explicando que será redirigido
  showPaymentProcessingMessage();
  
  const messages = document.getElementById('messages');
  if (messages) {
    messages.innerHTML = `
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Redirigiendo a Mercado Pago...</strong><br>
        <small>
          Serás redirigido a la página de pago de Mercado Pago. 
          <strong>Después de completar tu pago, serás redirigido automáticamente</strong> a la página de confirmación.
          <br><br>
          <i class="fas fa-info-circle me-1"></i>
          Si no eres redirigido automáticamente después del pago, busca el botón 
          <strong>"Volver al sitio"</strong> o <strong>"Continuar"</strong> en la página de Mercado Pago.
        </small>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
  }

  // Guardar información en sessionStorage para cuando regrese
  sessionStorage.setItem('pendingPayment', JSON.stringify({
    orderId,
    preferenceId: preference?.preferenceId,
    timestamp: Date.now(),
    redirectedInSameTab: true
  }));

  // NOTA: No iniciamos el monitoreo aquí porque cuando se redirige en la misma pestaña,
  // el código JavaScript se pierde. El monitoreo se hace desde la página de éxito cuando
  // el usuario regresa con el orderId en la URL. El auto_return de Mercado Pago debería
  // redirigir automáticamente después del pago aprobado.

  // Esperar un momento para que el usuario vea el mensaje, luego redirigir
  setTimeout(() => {
    console.log('🔄 Redirigiendo a Mercado Pago:', redirectUrl);
    window.location.href = redirectUrl;
  }, 1500);
}

async function checkOrderPaymentStatus(orderId) {
  const token = localStorage.getItem('authToken');
  
  // Preparar headers (token opcional para usuarios guest)
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/status/${orderId}`, {
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn('⚠️ No se pudo consultar el estado del pago:', response.status);
      return null;
    }

    const data = await response.json();
    return data?.paymentStatus || data?.status || null;
  } catch (error) {
    console.error('❌ Error consultando estado del pago:', error);
    return null;
  }
}

async function confirmPaymentStatus({ orderId, paymentId, preferenceId, statusHint }) {
  if (!orderId && !preferenceId) {
    return null;
  }

  const token = localStorage.getItem('authToken');
  
  // Preparar headers (token opcional para usuarios guest)
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/mercadopago/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        paymentId,
        preferenceId,
        statusHint
      })
    });

    if (!response.ok) {
      console.warn('⚠️ No se pudo confirmar el pago con el backend:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error confirmando pago con el backend:', error);
    return null;
  }
}

function redirectToSuccessPage(orderId, status, preference) {
  const params = new URLSearchParams();
  params.set('orderId', orderId);

  if (status) {
    params.set('status', status);
  }

  if (preference?.preferenceId) {
    params.set('preferenceId', preference.preferenceId);
  }

  if (preference?.mode) {
    params.set('mode', preference.mode);
  }

  const query = params.toString();
  window.location.href = `/checkout/success${query ? `?${query}` : ''}`;
}

function finishPaymentFlow({ orderId, paymentWindow, status, preference }) {
  if (paymentMonitorInterval) {
    clearInterval(paymentMonitorInterval);
    paymentMonitorInterval = null;
  }

  if (paymentWindow && !paymentWindow.closed) {
    try {
      paymentWindow.close();
    } catch (error) {
      console.warn('⚠️ No se pudo cerrar la ventana de pago:', error);
    }
  }

  const normalizedStatus = (status || '').toLowerCase();
  const isSuccess = ['approved', 'paid', 'confirmed'].includes(normalizedStatus);
  const isPending = ['pending', 'in_process', 'authorized', 'processing', ''].includes(normalizedStatus);
  const isFailure = ['failed', 'rejected', 'cancelled', 'canceled'].includes(normalizedStatus);

  if (isSuccess) {
    redirectToSuccessPage(orderId, 'approved', preference);
    return;
  }

  if (isPending) {
    redirectToSuccessPage(orderId, normalizedStatus || 'pending', preference);
    return;
  }

  redirectToSuccessPage(orderId, normalizedStatus || 'rejected', preference);
}

function startMercadoPagoMonitoring({ orderId, paymentWindow, preference }) {
  if (paymentMonitorInterval) {
    clearInterval(paymentMonitorInterval);
    paymentMonitorInterval = null;
  }

  let attempts = 0;
  let backendConfirmationAttempts = 0;
  let lastKnownStatus = null;

  const extractStatusFromConfirmation = (confirmation) => {
    if (!confirmation) return null;
    const orderStatus = confirmation.order?.paymentStatus || confirmation.order?.status;
    const directStatus = confirmation.paymentStatus || confirmation.status;
    return (orderStatus || directStatus || '').toLowerCase() || null;
  };

  const tryBackendConfirmation = async (currentStatus) => {
    if (!orderId && !preference?.preferenceId) {
      return null;
    }

    const confirmation = await confirmPaymentStatus({
      orderId,
      preferenceId: preference?.preferenceId,
      paymentId: preference?.paymentId,
      statusHint: currentStatus
    });

    const confirmedStatus = extractStatusFromConfirmation(confirmation);
    if (confirmedStatus) {
      lastKnownStatus = confirmedStatus;
      console.log('✅ Confirmación directa desde MercadoPago:', confirmedStatus);
    }

    return confirmedStatus;
  };

  const monitor = async () => {
    attempts += 1;

    const status = await checkOrderPaymentStatus(orderId);

    if (status) {
      const normalizedStatus = status.toLowerCase();
      lastKnownStatus = normalizedStatus;

      if (['paid', 'approved', 'confirmed'].includes(normalizedStatus)) {
        finishPaymentFlow({ orderId, paymentWindow, status: 'approved', preference });
        return;
      }

      if (['failed', 'rejected', 'cancelled', 'canceled'].includes(normalizedStatus)) {
        finishPaymentFlow({ orderId, paymentWindow, status: 'failed', preference });
        return;
      }

       if (['pending', 'in_process', 'authorized', 'processing'].includes(normalizedStatus) &&
           attempts % PAYMENT_CONFIRMATION_INTERVAL === 0) {
         backendConfirmationAttempts += 1;
         const confirmedStatus = await tryBackendConfirmation(normalizedStatus);

         if (confirmedStatus) {
           if (['paid', 'approved', 'confirmed'].includes(confirmedStatus)) {
             finishPaymentFlow({ orderId, paymentWindow, status: 'approved', preference });
             return;
           }

           if (['failed', 'rejected', 'cancelled', 'canceled'].includes(confirmedStatus)) {
             finishPaymentFlow({ orderId, paymentWindow, status: 'failed', preference });
             return;
           }
         }
       }
    }
    else if (attempts % PAYMENT_CONFIRMATION_INTERVAL === 0) {
      backendConfirmationAttempts += 1;
      const confirmedStatus = await tryBackendConfirmation(lastKnownStatus);

      if (confirmedStatus) {
        if (['paid', 'approved', 'confirmed'].includes(confirmedStatus)) {
          finishPaymentFlow({ orderId, paymentWindow, status: 'approved', preference });
          return;
        }

        if (['failed', 'rejected', 'cancelled', 'canceled'].includes(confirmedStatus)) {
          finishPaymentFlow({ orderId, paymentWindow, status: 'failed', preference });
          return;
        }
      }
    }

    if (paymentWindow != null && paymentWindow.closed) {
      const confirmedStatus = await tryBackendConfirmation(lastKnownStatus);
      finishPaymentFlow({
        orderId,
        paymentWindow,
        status: confirmedStatus || status || 'pending',
        preference
      });
      return;
    }

    if (attempts >= PAYMENT_MAX_ATTEMPTS) {
      console.warn('⚠️ Tiempo de espera agotado para el pago. Redirigiendo al resumen del pedido.');
      let confirmedStatus = lastKnownStatus;

      if (backendConfirmationAttempts < PAYMENT_FINAL_CONFIRMATION_RETRIES) {
        confirmedStatus = await tryBackendConfirmation(lastKnownStatus) || confirmedStatus;
      }

      finishPaymentFlow({
        orderId,
        paymentWindow,
        status: confirmedStatus || status || 'pending',
        preference
      });
    }
  };

  paymentMonitorInterval = setInterval(monitor, PAYMENT_POLL_INTERVAL);
  paymentMonitorInterval.updatePaymentWindow = (newWindow) => {
    paymentWindow = newWindow;
  };
}

// Make functions globally available
window.nextStep = nextStep;
window.prevStep = prevStep;
