const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../src/config/app');

async function testLogoSimple() {
  try {
    console.log('🧪 Probando sistema de logo (versión simple)...\n');

    // 1. Login del administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${config.apiBaseUrl}/api/auth/login`, {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso');

    // 2. Crear imagen de prueba simple
    console.log('\n2️⃣ Creando imagen de prueba...');
    const testImageBuffer = fs.readFileSync('./test-image.jpg');

    // 3. Subir como logo
    console.log('\n3️⃣ Probando upload de logo...');
    const formData = new FormData();
    formData.append('logo', testImageBuffer, {
      filename: 'test-logo.jpg',
      contentType: 'image/jpeg'
    });

    try {
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

    } catch (error) {
      console.log('❌ Error en la prueba:', error.response?.data || error.message);
      console.log('💡 Asegúrate de que el servidor esté reiniciado para cargar las nuevas rutas');
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testLogoSimple();
