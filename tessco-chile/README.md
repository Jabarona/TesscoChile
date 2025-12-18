# Tessco Chile - E-commerce de Tecnología

## Descripción del Proyecto

Tessco Chile es un e-commerce moderno especializado en tecnología y accesorios. El proyecto está construido con tecnologías web modernas y está diseñado para ofrecer una experiencia de compra excepcional.

## Características Principales

### Frontend (Sitio Web Público)
- ✅ Página principal con banners y productos destacados
- ✅ Catálogo por categorías (Notebooks, Smartphones, Accesorios, Monitores)
- ✅ Vista de detalle de producto
- ✅ Carrito de compras persistente (localStorage)
- ✅ Diseño responsive y moderno
- ✅ Paleta de colores: Naranja (#FF6B35), Blanco y Negro

### Backend (API REST)
- ✅ API REST con Node.js y Express
- ✅ Base de datos PostgreSQL con Prisma ORM
- ✅ Autenticación JWT
- ✅ Integración con MercadoPago
- ✅ Sistema de órdenes y pagos
- ✅ Panel de administración

### Funcionalidades Implementadas
- ✅ Sistema de carrito de compras con localStorage
- ✅ Interfaz de usuario en español
- ✅ Diseño responsive para móviles, tablets y desktop
- ✅ Animaciones y efectos visuales modernos
- ✅ Configuración modular del e-commerce
- ✅ API REST completa
- ✅ Sistema de autenticación
- ✅ Gestión de productos y categorías

### Tecnologías Utilizadas

#### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **Bootstrap 5** - Framework CSS responsive
- **JavaScript (ES6+)** - Funcionalidad interactiva
- **Swiper.js** - Sliders y carruseles
- **jQuery** - Manipulación del DOM

#### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Prisma** - ORM para base de datos
- **JWT** - Autenticación
- **MercadoPago** - Pasarela de pagos
- **Nodemailer** - Envío de emails

#### DevOps
- **Docker** - Contenedores
- **Docker Compose** - Orquestación
- **Nginx** - Proxy reverso
- **Git** - Control de versiones

## Estructura del Proyecto

```
tessco-chile/
├── frontend/                    # Aplicación frontend
│   ├── src/
│   │   ├── pages/              # Páginas HTML
│   │   ├── components/         # Componentes reutilizables
│   │   ├── assets/            # Recursos estáticos
│   │   │   ├── css/           # Estilos
│   │   │   ├── js/            # Scripts JavaScript
│   │   │   └── images/        # Imágenes
│   │   └── config/            # Configuración
│   ├── public/                # Archivos públicos
│   └── package.json           # Dependencias frontend
├── backend/                    # API backend
│   ├── src/
│   │   ├── controllers/       # Controladores
│   │   ├── models/           # Modelos de datos
│   │   ├── routes/           # Rutas de la API
│   │   ├── middleware/       # Middleware personalizado
│   │   └── config/           # Configuración
│   ├── prisma/               # Esquema de base de datos
│   └── package.json          # Dependencias backend
├── docs/                      # Documentación
├── scripts/                   # Scripts de automatización
├── nginx/                     # Configuración Nginx
├── docker-compose.yml         # Orquestación de contenedores
└── package.json              # Dependencias del proyecto
```

## Configuración del E-commerce

El archivo `js/ecommerce-config.js` contiene toda la configuración del e-commerce:

- **Información de la empresa**
- **Categorías de productos**
- **Configuración del carrito**
- **Configuración de pagos (MercadoPago)**
- **Configuración de envíos**
- **Configuración de la API**

## Funcionalidades del Carrito

### Clase ShoppingCart
- `addItem(product)` - Agregar producto al carrito
- `removeItem(productId)` - Eliminar producto del carrito
- `updateQuantity(productId, quantity)` - Actualizar cantidad
- `getTotal()` - Obtener total del carrito
- `getItemCount()` - Obtener número de items
- `clear()` - Limpiar carrito

### Persistencia
- Los datos del carrito se guardan en `localStorage`
- Se mantiene la información entre sesiones
- Actualización automática de la interfaz

## Próximos Pasos

### 1. Backend GraphQL
- [ ] Configurar servidor Node.js con Apollo Server
- [ ] Implementar esquemas GraphQL para productos, usuarios y órdenes
- [ ] Configurar base de datos PostgreSQL con Prisma
- [ ] Implementar autenticación JWT

### 2. Panel de Administración
- [ ] Login para administrador
- [ ] Dashboard con estadísticas
- [ ] CRUD de productos
- [ ] Gestión de usuarios
- [ ] Gestión de órdenes

### 3. Funcionalidades Adicionales
- [ ] Sistema de registro e inicio de sesión
- [ ] Verificación de correo electrónico
- [ ] Página de perfil del usuario
- [ ] Historial de compras
- [ ] Integración con MercadoPago
- [ ] Sistema de notificaciones por email

## Instalación y Uso

### Configuración Rápida

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tessco-chile/ecommerce.git
   cd tessco-chile
   ```

2. **Ejecutar script de configuración**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configurar variables de entorno**
   ```bash
   cp backend/.env.example backend/.env
   # Editar backend/.env con tus configuraciones
   ```

### 🗄️ Configuración de Prisma

**Para una nueva máquina, sigue estos pasos:**

1. **Configurar base de datos PostgreSQL**
   ```bash
   # Crear base de datos
   sudo -u postgres psql
   CREATE DATABASE tessco_chile;
   CREATE USER tessco_user WITH PASSWORD 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE tessco_chile TO tessco_user;
   \q
   ```

2. **Configurar Prisma**
   ```bash
   cd backend
   
   # Generar cliente de Prisma
   npm run db:generate
   
   # Aplicar migraciones (desarrollo)
   npm run db:migrate
   
   # O para producción
   npm run db:migrate:deploy
   
   # Crear usuario administrador
   npm run create-admin
   ```

3. **Verificar configuración**
   ```bash
   # Abrir Prisma Studio (opcional)
   npm run db:studio
   
   # Ver estado de migraciones
   npm run db:status
   ```

**Comandos útiles de Prisma:**
- `npm run db:generate` - Generar cliente
- `npm run db:migrate` - Aplicar migraciones (desarrollo)
- `npm run db:migrate:deploy` - Aplicar migraciones (producción)
- `npm run db:studio` - Abrir interfaz visual
- `npm run db:reset` - Resetear base de datos
- `npm run setup` - Configuración completa (producción)
- `npm run setup:dev` - Configuración completa (desarrollo)

**Credenciales de administrador:**
- Email: `giraldocarloscl@gmail.com`
- Password: `carlosvas12`

📚 **Documentación detallada:** [Guía de Prisma](./backend/PRISMA-SETUP.md)

### Desarrollo Local (Sin Docker)

1. **Configuración inicial**
   ```bash
   chmod +x scripts/setup-local.sh
   ./scripts/setup-local.sh
   ```

2. **Configurar base de datos PostgreSQL**
   ```bash
   # Crear base de datos
   createdb tessco_chile
   
   # Inicializar tablas
   cd backend
   npm run db:init
   ```

3. **Iniciar desarrollo**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Con Docker (Recomendado)

1. **Despliegue completo**
   ```bash
   docker-compose up -d
   ```

2. **Verificar servicios**
   ```bash
   docker-compose ps
   ```

### URLs de Desarrollo

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Base de datos**: localhost:5432
- **Redis**: localhost:6379

## Desarrollo

### Estructura de Colores
- **Primario**: #FF6B35 (Naranja)
- **Primario Oscuro**: #E55A2B
- **Secundario**: #6c757d (Gris)
- **Negro**: #020202
- **Blanco**: #FFFFFF
- **Gris Claro**: #F1F1F0

### Responsive Design
- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: 576px, 768px, 992px, 1200px, 1400px
- **Grid System**: Bootstrap 5 Grid System

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto Desarrollador

- **Email**: giraldocarloscl@gmail.com
- **Teléfono**: +56 9 78463458
-  Santiago, Chile

---

Desarrollado con ❤️ para Tessco Chile
