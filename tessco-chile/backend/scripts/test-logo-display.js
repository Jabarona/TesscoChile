const axios = require('axios');
const config = require('../src/config/app');

async function testLogoDisplay() {
  try {
    console.log('🧪 Probando visualización del logo...\n');

    // 1. Login del administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${config.apiBaseUrl}/api/auth/login`, {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso');

    // 2. Obtener logo actual
    console.log('\n2️⃣ Obteniendo logo actual...');
    const logoResponse = await axios.get(`${config.apiBaseUrl}/api/upload/logo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Logo obtenido exitosamente');
    console.log('   Logo path:', logoResponse.data.data.logo);

    // 3. Verificar que la imagen existe
    console.log('\n3️⃣ Verificando que la imagen existe...');
    const imageUrl = `${config.apiBaseUrl}${logoResponse.data.data.logo}`;
    console.log('   URL completa:', imageUrl);

    const imageResponse = await axios.head(imageUrl);
    console.log('✅ Imagen accesible:', imageResponse.status);

    // 4. Verificar CORS
    console.log('\n4️⃣ Verificando headers CORS...');
    console.log('   Access-Control-Allow-Origin:', imageResponse.headers['access-control-allow-origin']);
    console.log('   Content-Type:', imageResponse.headers['content-type']);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testLogoDisplay();
