const sass = require('sass');
const fs = require('fs');
const path = require('path');

// Compilar SCSS a CSS
function buildCSS() {
  try {
    const scssFile = path.join(__dirname, 'src/assets/scss/custom-bootstrap.scss');
    const cssFile = path.join(__dirname, 'src/assets/css/custom-bootstrap.css');
    
    console.log('🎨 Compilando Bootstrap personalizado...');
    
    const result = sass.compile(scssFile, {
      style: 'expanded',
      sourceMap: true,
      loadPaths: [
        path.join(__dirname, 'node_modules')
      ]
    });
    
    // Crear directorio si no existe
    const cssDir = path.dirname(cssFile);
    if (!fs.existsSync(cssDir)) {
      fs.mkdirSync(cssDir, { recursive: true });
    }
    
    // Escribir CSS compilado
    fs.writeFileSync(cssFile, result.css);
    
    // Escribir source map si existe
    if (result.sourceMap) {
      fs.writeFileSync(cssFile + '.map', JSON.stringify(result.sourceMap, null, 2));
    }
    
    console.log('✅ Bootstrap personalizado compilado exitosamente');
    console.log(`📁 Archivo generado: ${cssFile}`);
    
  } catch (error) {
    console.error('❌ Error compilando SCSS:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  buildCSS();
}

module.exports = { buildCSS };
