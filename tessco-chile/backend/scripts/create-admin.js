const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creando usuario administrador...');

    // Verificar si ya existe un usuario con este email
    const existingUser = await prisma.user.findUnique({
      where: { email: 'giraldocarloscl@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  Ya existe un usuario con el email giraldocarloscl@gmail.com');
      
      // Actualizar el usuario existente a admin si no lo es
      if (existingUser.role !== 'admin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { 
            role: 'admin',
            isVerified: true
          }
        });
        console.log('✅ Usuario actualizado a administrador');
      } else {
        console.log('✅ El usuario ya es administrador');
      }
      return;
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('carlosvas12', saltRounds);

    // Crear usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        email: 'giraldocarloscl@gmail.com',
        password: hashedPassword,
        firstName: 'Carlos',
        lastName: 'Giraldo',
        role: 'admin',
        isVerified: true
      }
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Nombre: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Rol: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
createAdminUser()
  .then(() => {
    console.log('🎉 Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
