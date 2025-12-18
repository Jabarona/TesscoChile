const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'notebooks' },
      update: {},
      create: {
        name: 'Notebooks',
        slug: 'notebooks',
        description: 'Computadores portátiles',
        imageUrl: '/images/category-thumb-1.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'smartphones' },
      update: {},
      create: {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Teléfonos inteligentes',
        imageUrl: '/images/category-thumb-2.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'accesorios' },
      update: {},
      create: {
        name: 'Accesorios',
        slug: 'accesorios',
        description: 'Accesorios para tecnología',
        imageUrl: '/images/category-thumb-3.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'monitores' },
      update: {},
      create: {
        name: 'Monitores',
        slug: 'monitores',
        description: 'Monitores y pantallas',
        imageUrl: '/images/category-thumb-4.jpg'
      }
    })
  ]);

  console.log('✅ Categorías creadas');

  // Crear marcas
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'apple' },
      update: {},
      create: {
        name: 'Apple',
        slug: 'apple',
        logoUrl: '/images/brands/apple.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'samsung' },
      update: {},
      create: {
        name: 'Samsung',
        slug: 'samsung',
        logoUrl: '/images/brands/samsung.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'sony' },
      update: {},
      create: {
        name: 'Sony',
        slug: 'sony',
        logoUrl: '/images/brands/sony.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'razer' },
      update: {},
      create: {
        name: 'Razer',
        slug: 'razer',
        logoUrl: '/images/brands/razer.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'logitech' },
      update: {},
      create: {
        name: 'Logitech',
        slug: 'logitech',
        logoUrl: '/images/brands/logitech.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'seagate' },
      update: {},
      create: {
        name: 'Seagate',
        slug: 'seagate',
        logoUrl: '/images/brands/seagate.png'
      }
    })
  ]);

  console.log('✅ Marcas creadas');

  // Crear productos de ejemplo
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-1' },
      update: {},
      create: {
        id: 'prod-1',
        name: 'MacBook Air M3',
        description: 'Notebook ultradelgado con chip M3, perfecto para trabajo y creatividad',
        price: 1299990,
        imageUrl: '/images/product-small-1.jpg',
        images: ['/images/product-small-1.jpg', '/images/product-thumbnail-1.jpg'],
        categoryId: categories[0].id, // Notebooks
        brandId: brands[0].id, // Apple
        stock: 10
      }
    }),
    prisma.product.upsert({
      where: { id: 'prod-2' },
      update: {},
      create: {
        id: 'prod-2',
        name: 'Samsung Galaxy S24',
        description: 'Smartphone premium con cámara profesional y pantalla AMOLED',
        price: 899990,
        imageUrl: '/images/product-small-2.jpg',
        images: ['/images/product-small-2.jpg', '/images/product-thumbnail-2.jpg'],
        categoryId: categories[1].id, // Smartphones
        brandId: brands[1].id, // Samsung
        stock: 15
      }
    }),
    prisma.product.upsert({
      where: { id: 'prod-3' },
      update: {},
      create: {
        id: 'prod-3',
        name: 'Audífonos Sony WH-1000XM5',
        description: 'Audífonos inalámbricos con cancelación de ruido líder en la industria',
        price: 349990,
        imageUrl: '/images/product-small-3.jpg',
        images: ['/images/product-small-3.jpg', '/images/product-thumbnail-3.jpg'],
        categoryId: categories[2].id, // Accesorios
        brandId: brands[2].id, // Sony
        stock: 25
      }
    }),
    prisma.product.upsert({
      where: { id: 'prod-4' },
      update: {},
      create: {
        id: 'prod-4',
        name: 'Monitor Samsung 24"',
        description: 'Monitor Full HD con tecnología IPS y diseño sin bordes',
        price: 199990,
        imageUrl: '/images/product-small-4.jpg',
        images: ['/images/product-small-4.jpg', '/images/product-thumbnail-4.jpg'],
        categoryId: categories[3].id, // Monitores
        brandId: brands[1].id, // Samsung
        stock: 8
      }
    }),
    prisma.product.upsert({
      where: { id: 'prod-5' },
      update: {},
      create: {
        id: 'prod-5',
        name: 'Teclado Mecánico Razer',
        description: 'Teclado gaming con switches mecánicos y retroiluminación RGB',
        price: 79990,
        imageUrl: '/images/product-thumbnail-5.jpg',
        images: ['/images/product-thumbnail-5.jpg'],
        categoryId: categories[2].id, // Accesorios
        brandId: brands[3].id, // Razer
        stock: 20
      }
    })
  ]);

  console.log('✅ Productos creados');

  // Crear usuario admin de ejemplo
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tesscochile.com' },
    update: {},
    create: {
      email: 'admin@tesscochile.com',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJByJ.BDcGx8V2Q2/2a', // password: admin123
      firstName: 'Admin',
      lastName: 'Tessco',
      role: 'admin',
      isVerified: true
    }
  });

  console.log('✅ Usuario admin creado');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
