const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../src/config/app');

async function testLogo() {
  try {
    console.log('🧪 Probando sistema de logo...\n');

    // 1. Login del administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${config.apiBaseUrl}/api/auth/login`, {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso');

    // 2. Crear imagen de prueba para logo
    console.log('\n2️⃣ Creando imagen de prueba para logo...');
    const sharp = require('sharp');
    const logoBuffer = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: Buffer.from(`
        <svg width="200" height="100">
          <rect width="200" height="100" fill="#ff6b35"/>
          <text x="100" y="50" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">TESSCO</text>
          <text x="100" y="70" font-family="Arial" font-size="12" text-anchor="middle" fill="white">CHILE</text>
        </svg>
      `),
      top: 0,
      left: 0
    }])
    .png()
    .toBuffer();

    // 3. Subir logo
    console.log('\n3️⃣ Probando upload de logo...');
    const formData = new FormData();
    formData.append('logo', logoBuffer, {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(`${config.apiBaseUrl}/api/upload/logo`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Upload de logo exitoso');
    console.log('   Logo:', uploadResponse.data.data.logo);

    // 4. Obtener logo actual
    console.log('\n4️⃣ Probando obtención de logo...');
    const getResponse = await axios.get(`${config.apiBaseUrl}/api/upload/logo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Obtención de logo exitosa');
    console.log('   Logo actual:', getResponse.data.data.logo);

    // 5. Eliminar logo
    console.log('\n5️⃣ Probando eliminación de logo...');
    const deleteResponse = await axios.delete(`${config.apiBaseUrl}/api/upload/logo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Eliminación de logo exitosa');

    console.log('\n🎉 Todas las pruebas de logo pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testLogo();
