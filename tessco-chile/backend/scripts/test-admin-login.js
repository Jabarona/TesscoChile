const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000/api';

async function testAdminLogin() {
  console.log('🔐 Probando login del usuario administrador...\n');

  try {
    // Probar login del administrador
    const loginData = {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    };

    console.log('1️⃣ Intentando login con credenciales de administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    console.log('✅ Login de administrador exitoso!');
    console.log('   Email:', loginResponse.data.data.user.email);
    console.log('   Nombre:', loginResponse.data.data.user.firstName, loginResponse.data.data.user.lastName);
    console.log('   Rol:', loginResponse.data.data.user.role);
    console.log('   Verificado:', loginResponse.data.data.user.isVerified);
    console.log('   Token generado:', loginResponse.data.data.token ? 'Sí' : 'No');

    const token = loginResponse.data.data.token;

    // Probar endpoint protegido con token de admin
    console.log('\n2️⃣ Probando acceso a endpoint protegido con token de admin...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Acceso a endpoint protegido exitoso');
    console.log('   Usuario actual:', meResponse.data.data.user.email);
    console.log('   Rol del usuario:', meResponse.data.data.user.role);

    console.log('\n🎉 Login del administrador funcionando perfectamente!');

  } catch (error) {
    console.error('❌ Error en el login del administrador:', error.response?.data || error.message);
  }
}

// Ejecutar prueba
testAdminLogin();
