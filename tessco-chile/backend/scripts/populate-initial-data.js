const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateInitialData() {
  try {
    console.log('🌱 Iniciando población de datos iniciales...');

    // Crear categorías iniciales
    const categories = [
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Teléfonos inteligentes y accesorios',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Computadoras portátiles y notebooks',
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'
      },
      {
        name: 'Accesorios',
        slug: 'accesorios',
        description: 'Accesorios para dispositivos electrónicos',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
      },
      {
        name: 'Audio',
        slug: 'audio',
        description: 'Audífonos, parlantes y equipos de audio',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Equipos y accesorios para gaming',
        imageUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400'
      }
    ];

    console.log('📱 Creando categorías...');
    for (const categoryData of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug }
      });

      if (!existingCategory) {
        const category = await prisma.category.create({
          data: categoryData
        });
        console.log(`✅ Categoría creada: ${category.name}`);
      } else {
        console.log(`⚠️  Categoría ya existe: ${categoryData.name}`);
      }
    }

    // Crear marcas iniciales
    const brands = [
      {
        name: 'Samsung',
        slug: 'samsung',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/06/Samsung-Logo.png'
      },
      {
        name: 'Apple',
        slug: 'apple',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png'
      },
      {
        name: 'Huawei',
        slug: 'huawei',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/Huawei-Logo.png'
      },
      {
        name: 'Xiaomi',
        slug: 'xiaomi',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/Xiaomi-Logo.png'
      },
      {
        name: 'Sony',
        slug: 'sony',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/06/Sony-Logo.png'
      },
      {
        name: 'LG',
        slug: 'lg',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/06/LG-Logo.png'
      },
      {
        name: 'HP',
        slug: 'hp',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/HP-Logo.png'
      },
      {
        name: 'Dell',
        slug: 'dell',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/Dell-Logo.png'
      },
      {
        name: 'Lenovo',
        slug: 'lenovo',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/Lenovo-Logo.png'
      },
      {
        name: 'Asus',
        slug: 'asus',
        logoUrl: 'https://logos-world.net/wp-content/uploads/2020/09/ASUS-Logo.png'
      }
    ];

    console.log('🏷️  Creando marcas...');
    for (const brandData of brands) {
      const existingBrand = await prisma.brand.findUnique({
        where: { slug: brandData.slug }
      });

      if (!existingBrand) {
        const brand = await prisma.brand.create({
          data: brandData
        });
        console.log(`✅ Marca creada: ${brand.name}`);
      } else {
        console.log(`⚠️  Marca ya existe: ${brandData.name}`);
      }
    }

    // Crear algunos productos de ejemplo
    const smartphonesCategory = await prisma.category.findUnique({
      where: { slug: 'smartphones' }
    });

    const laptopsCategory = await prisma.category.findUnique({
      where: { slug: 'laptops' }
    });

    const audioCategory = await prisma.category.findUnique({
      where: { slug: 'audio' }
    });

    const samsungBrand = await prisma.brand.findUnique({
      where: { slug: 'samsung' }
    });

    const appleBrand = await prisma.brand.findUnique({
      where: { slug: 'apple' }
    });

    const sonyBrand = await prisma.brand.findUnique({
      where: { slug: 'sony' }
    });

    const products = [
      {
        name: 'Samsung Galaxy S24',
        description: 'El último smartphone de Samsung con cámara de 200MP y pantalla AMOLED de 6.2 pulgadas.',
        price: 899990,
        stock: 25,
        categoryId: smartphonesCategory?.id,
        brandId: samsungBrand?.id,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
        ]
      },
      {
        name: 'iPhone 15 Pro',
        description: 'El iPhone más avanzado con chip A17 Pro y cámara de 48MP.',
        price: 1199990,
        stock: 15,
        categoryId: smartphonesCategory?.id,
        brandId: appleBrand?.id,
        imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
        images: [
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400'
        ]
      },
      {
        name: 'MacBook Air M2',
        description: 'Laptop ultraportátil con chip M2 de Apple y pantalla Liquid Retina de 13.6 pulgadas.',
        price: 1499990,
        stock: 8,
        categoryId: laptopsCategory?.id,
        brandId: appleBrand?.id,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'
        ]
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Audífonos inalámbricos con cancelación de ruido líder en la industria.',
        price: 399990,
        stock: 20,
        categoryId: audioCategory?.id,
        brandId: sonyBrand?.id,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
        ]
      }
    ];

    console.log('📦 Creando productos de ejemplo...');
    for (const productData of products) {
      if (productData.categoryId && productData.brandId) {
        const existingProduct = await prisma.product.findFirst({
          where: { 
            name: productData.name,
            brandId: productData.brandId
          }
        });

        if (!existingProduct) {
          const product = await prisma.product.create({
            data: productData
          });
          console.log(`✅ Producto creado: ${product.name}`);
        } else {
          console.log(`⚠️  Producto ya existe: ${productData.name}`);
        }
      }
    }

    console.log('🎉 ¡Datos iniciales poblados exitosamente!');
    
    // Mostrar resumen
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();
    const productCount = await prisma.product.count();

    console.log('\n📊 Resumen:');
    console.log(`   Categorías: ${categoryCount}`);
    console.log(`   Marcas: ${brandCount}`);
    console.log(`   Productos: ${productCount}`);

  } catch (error) {
    console.error('❌ Error poblando datos iniciales:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  populateInitialData()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = populateInitialData;
