const axios = require('axios');

async function quickTest() {
  try {
    console.log('🧪 Prueba rápida del backend...');
    
    // Probar endpoint de salud
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('✅ Backend respondiendo:', healthResponse.data.status);
    
    // Probar login del admin
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    });
    
    console.log('✅ Login exitoso:', loginResponse.data.message);
    console.log('👤 Usuario:', loginResponse.data.data.user.email);
    console.log('🔑 Token generado:', loginResponse.data.data.token ? 'Sí' : 'No');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend no está corriendo en puerto 4000');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

quickTest();
