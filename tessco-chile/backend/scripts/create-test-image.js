const sharp = require('sharp');
const fs = require('fs');

async function createTestImage() {
  try {
    // Crear una imagen de prueba simple
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 } // Rojo
      }
    })
    .jpeg()
    .toBuffer();

    // Guardar la imagen
    fs.writeFileSync('test-image.jpg', imageBuffer);
    console.log('✅ Imagen de prueba creada: test-image.jpg');
    
    return imageBuffer;
  } catch (error) {
    console.error('❌ Error creando imagen:', error);
  }
}

createTestImage();
