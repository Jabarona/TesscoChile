const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const email = 'samu22890@gmail.com';
  const plainPassword = 'carlosvas12';

  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      firstName: 'Zamuel',
      lastName: 'Matos',
      role: 'admin',
      isVerified: true
    },
    create: {
      email,
      password: hashedPassword,
      firstName: 'Zamuel',
      lastName: 'Matos',
      role: 'admin',
      isVerified: true
    }
  });

  console.log('✅ Usuario admin creado/actualizado:', {
    id: user.id,
    email: user.email,
    role: user.role
  });

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error creando admin:', err);
    prisma.$disconnect();
    process.exit(1);
  });