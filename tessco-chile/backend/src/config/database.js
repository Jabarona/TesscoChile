const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Función para verificar la conexión
const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Función para conectar a la base de datos
const connectDatabase = async () => {
  try {
    await testConnection();
    console.log('📊 Database connection established');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

// Función para desconectar de la base de datos
const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('📊 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

module.exports = {
  prisma,
  testConnection,
  connectDatabase,
  disconnectDatabase
};