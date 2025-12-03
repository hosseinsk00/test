import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle connection errors
prisma.$connect()
  .then(() => {
    console.log('✅ اتصال به دیتابیس برقرار شد');
  })
  .catch((error) => {
    console.error('❌ خطا در اتصال به دیتابیس:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
