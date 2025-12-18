# API Documentation - Tessco Chile

## Información General

La API de Tessco Chile está construida con Node.js, Express y Prisma, proporcionando endpoints RESTful para el e-commerce.

- **Base URL**: `http://localhost:4000/api`
- **Versión**: 1.0.0
- **Formato**: JSON
- **Autenticación**: JWT Bearer Token

## Autenticación

### Registro de Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+56912345678"
}
```

### Inicio de Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

### Respuesta de Autenticación
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez"
    },
    "token": "jwt_token_here"
  }
}
```

## Productos

### Obtener Todos los Productos
```http
GET /api/products?page=1&limit=12&category=notebooks&brand=apple&sort=price&order=asc
```

**Parámetros de Query:**
- `page`: Número de página (default: 1)
- `limit`: Productos por página (default: 12)
- `category`: Filtrar por categoría
- `brand`: Filtrar por marca
- `sort`: Campo para ordenar (name, price, createdAt)
- `order`: Orden (asc, desc)
- `search`: Búsqueda por nombre
- `minPrice`: Precio mínimo
- `maxPrice`: Precio máximo

### Obtener Producto por ID
```http
GET /api/products/:id
```

### Crear Producto (Admin)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "MacBook Pro 14\" M3",
  "description": "Notebook profesional con chip M3",
  "price": 1899990,
  "categoryId": "category_id",
  "brandId": "brand_id",
  "stock": 10,
  "images": ["url1", "url2"]
}
```

### Actualizar Producto (Admin)
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "MacBook Pro 14\" M3 Actualizado",
  "price": 1799990
}
```

### Eliminar Producto (Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

## Categorías

### Obtener Todas las Categorías
```http
GET /api/categories
```

### Crear Categoría (Admin)
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Notebooks",
  "slug": "notebooks",
  "description": "Computadores portátiles"
}
```

## Órdenes

### Crear Orden
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "address": "Av. Principal 123",
    "city": "Santiago",
    "region": "Metropolitana",
    "postalCode": "1234567",
    "phone": "+56912345678"
  }
}
```

### Obtener Órdenes del Usuario
```http
GET /api/orders
Authorization: Bearer <token>
```

### Obtener Orden por ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

## Pagos

### Crear Pago con MercadoPago
```http
POST /api/payments/mercadopago
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "paymentMethod": "mercadopago"
}
```

### Webhook de MercadoPago
```http
POST /api/payments/webhook/mercadopago
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "payment_id"
  }
}
```

## Usuarios

### Obtener Perfil
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### Actualizar Perfil
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Juan Carlos",
  "lastName": "Pérez González",
  "phone": "+56987654321"
}
```

### Cambiar Contraseña
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

## Códigos de Estado HTTP

- `200` - OK
- `201` - Creado
- `400` - Solicitud incorrecta
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `409` - Conflicto
- `422` - Entidad no procesable
- `500` - Error interno del servidor

## Formato de Respuesta de Error

```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Rate Limiting

- **API General**: 100 requests por 15 minutos
- **Autenticación**: 5 requests por 15 minutos
- **Pagos**: 10 requests por 15 minutos

## Ejemplos de Uso

### JavaScript/Fetch
```javascript
// Obtener productos
const response = await fetch('http://localhost:4000/api/products?page=1&limit=12');
const data = await response.json();

// Crear orden
const orderResponse = await fetch('http://localhost:4000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    items: [{ productId: 'product_id', quantity: 1 }],
    shippingAddress: { /* ... */ }
  })
});
```

### cURL
```bash
# Obtener productos
curl -X GET "http://localhost:4000/api/products?page=1&limit=12"

# Crear orden
curl -X POST "http://localhost:4000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"items":[{"productId":"product_id","quantity":1}]}'
```
