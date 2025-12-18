const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

async function testConnection() {
  console.log('🔍 Probando conexión con el backend...\n');

  try {
    // 1. Probar endpoint de salud
    console.log('1️⃣ Probando endpoint de salud...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend respondiendo correctamente');
    console.log('   Estado:', healthResponse.data.status);
    console.log('   Puerto:', healthResponse.data.uptime ? 'Activo' : 'Inactivo');

    // 2. Probar login del administrador
    console.log('\n2️⃣ Probando login del administrador...');
    const loginData = {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login exitoso');
    console.log('   Usuario:', loginResponse.data.data.user.email);
    console.log('   Rol:', loginResponse.data.data.user.role);
    console.log('   Token generado:', loginResponse.data.data.token ? 'Sí' : 'No');

    console.log('\n🎉 Backend funcionando correctamente!');
    console.log('   URL del backend:', BASE_URL);
    console.log('   API disponible en:', `${BASE_URL}/api`);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: No se puede conectar al backend');
      console.error('   Asegúrate de que el backend esté corriendo en el puerto 4000');
      console.error('   Ejecuta: npm start');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

// Ejecutar prueba
testConnection();
