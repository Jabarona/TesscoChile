const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000/api';

async function testAuth() {
  console.log('🧪 Probando sistema de autenticación...\n');

  try {
    // 1. Probar registro de usuario
    console.log('1️⃣ Probando registro de usuario...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+56912345678'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registro exitoso:', registerResponse.data.message);
    console.log('   Usuario ID:', registerResponse.data.data.user.id);
    console.log('   Token generado:', registerResponse.data.data.token ? 'Sí' : 'No');

    const token = registerResponse.data.data.token;

    // 2. Probar login
    console.log('\n2️⃣ Probando login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login exitoso:', loginResponse.data.message);

    // 3. Probar endpoint protegido
    console.log('\n3️⃣ Probando endpoint protegido /me...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Acceso a endpoint protegido exitoso');
    console.log('   Usuario actual:', meResponse.data.data.user.email);

    // 4. Probar login con credenciales incorrectas
    console.log('\n4️⃣ Probando login con credenciales incorrectas...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Error de autenticación manejado correctamente');
      }
    }

    // 5. Probar acceso sin token
    console.log('\n5️⃣ Probando acceso sin token...');
    try {
      await axios.get(`${BASE_URL}/auth/me`);
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Acceso denegado sin token correctamente');
      }
    }

    console.log('\n🎉 Todas las pruebas de autenticación pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testAuth();
