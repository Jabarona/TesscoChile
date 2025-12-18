# Componentes Reutilizables de Tessco Chile

## Header Component

El componente de header es un componente reutilizable que proporciona una navegación consistente en todas las páginas del sitio.

### Uso

#### 1. Incluir los archivos necesarios en tu HTML:

```html
<!-- En el <head> -->
<link rel="stylesheet" href="../../assets/css/header.css">

<!-- Antes del cierre de </body> -->
<script src="../../components/header.js"></script>
```

#### 2. Agregar el contenedor en el HTML:

```html
<body>
  <!-- Header Component -->
  <div id="header"></div>
  
  <!-- Resto del contenido -->
</body>
```

#### 3. Inicializar el componente con JavaScript:

```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    loadHeader({
      activeLink: 'inicio',    // Opciones: 'inicio', 'tienda', 'contacto'
      showSearch: true,         // Mostrar icono de búsqueda
      showCart: true,           // Mostrar icono de carrito
      showWishlist: true        // Mostrar icono de favoritos
    });
  });
</script>
```

### Opciones de Configuración

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `activeLink` | String | `''` | Link activo en el menú ('inicio', 'tienda', 'contacto') |
| `showSearch` | Boolean | `true` | Muestra/oculta el icono de búsqueda |
| `showCart` | Boolean | `true` | Muestra/oculta el icono del carrito |
| `showWishlist` | Boolean | `true` | Muestra/oculta el icono de favoritos |

### Características

- ✅ **Responsive:** Adaptable a todos los tamaños de pantalla
- ✅ **Consistente:** Mismo diseño en todas las páginas
- ✅ **Personalizable:** Opciones para mostrar/ocultar elementos
- ✅ **Integrado con Auth:** Se integra automáticamente con el sistema de autenticación
- ✅ **Carrito Dinámico:** Badge que muestra la cantidad de items
- ✅ **Tema Oscuro:** Diseñado para el tema oscuro de Tessco

### Ejemplos

#### Página de Inicio
```javascript
loadHeader({
  activeLink: 'inicio',
  showSearch: true,
  showCart: true,
  showWishlist: true
});
```

#### Página de Tienda
```javascript
loadHeader({
  activeLink: 'tienda',
  showSearch: true,
  showCart: true,
  showWishlist: true
});
```

#### Página de Contacto (sin carrito ni favoritos)
```javascript
loadHeader({
  activeLink: 'contacto',
  showSearch: false,
  showCart: false,
  showWishlist: false
});
```

### Integración con Smart Navigation

El componente de header se integra automáticamente con `smart-navigation.js` para mostrar dinámicamente:
- Nombre del usuario cuando está autenticado
- Enlace al perfil cuando hay sesión
- Enlace al login cuando no hay sesión

### Estilos CSS

Los estilos están en `/assets/css/header.css` e incluyen:
- Variables CSS para colores personalizables
- Animaciones suaves
- Estilos responsive
- Temas consistentes con Tessco

### Notas Importantes

1. **Orden de carga de scripts:** 
   - Cargar `header.js` ANTES de `auth.js` y `smart-navigation.js`
   
2. **Rutas de imágenes:**
   - El logo se carga desde `/src/assets/images/logo.svg`
   - Asegúrate de que la ruta sea correcta según tu estructura

3. **Bootstrap:**
   - El componente requiere Bootstrap 5.3.2 o superior

4. **Font Awesome:**
   - No es requerido ya que usa SVG icons propios

---

## Footer Component

(Documentación del footer aquí...)

---

## Soporte

Para problemas o preguntas sobre los componentes, contacta al equipo de desarrollo de Tessco Chile.

