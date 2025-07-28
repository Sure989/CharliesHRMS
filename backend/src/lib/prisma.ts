
import { PrismaClient } from '@prisma/client';

// Singleton pattern for serverless environments (Vercel, AWS Lambda, etc.)
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
