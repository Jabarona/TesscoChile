const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../src/config/app');

async function testUpload() {
  try {
    console.log('🧪 Probando sistema de upload...\n');

    // 1. Login del administrador
    console.log('1️⃣ Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${config.apiBaseUrl}/api/auth/login`, {
      email: 'giraldocarloscl@gmail.com',
      password: 'carlosvas12'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso');

    // 2. Leer imagen de prueba
    const testImageBuffer = fs.readFileSync('test-image.jpg');

    // 3. Probar upload de producto
    console.log('\n2️⃣ Probando upload de producto...');
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-product.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await axios.post(`${config.apiBaseUrl}/api/upload/product`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Upload de producto exitoso');
    console.log('   Imagen original:', uploadResponse.data.data.image.original);
    console.log('   Thumbnail:', uploadResponse.data.data.image.thumbnail);

    // 4. Probar listado de imágenes
    console.log('\n3️⃣ Probando listado de imágenes...');
    const listResponse = await axios.get(`${config.apiBaseUrl}/api/upload/list/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Listado exitoso');
    console.log('   Imágenes encontradas:', listResponse.data.data.images.length);

    // 5. Probar eliminación de imagen
    if (listResponse.data.data.images.length > 0) {
      console.log('\n4️⃣ Probando eliminación de imagen...');
      const imageToDelete = listResponse.data.data.images[0].filename;
      
      const deleteResponse = await axios.delete(`${config.apiBaseUrl}/api/upload/products/${imageToDelete}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Eliminación exitosa');
    }

    console.log('\n🎉 Todas las pruebas de upload pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testUpload();
