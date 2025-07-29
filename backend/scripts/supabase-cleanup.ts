import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
import { prisma } from '../src/lib/prisma';

async function safeDelete(operation: () => Promise<any>, name: string) {
  try {
    await operation();
    console.log(`✅ Deleted ${name}`);
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table ${name} doesn't exist, skipping`);
    } else {
      throw error;
    }
  }
}

async function cleanup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.includes('supabase.com')) {
    console.error('❌ Not connected to Supabase. Aborting cleanup.');
    process.exit(1);
  }

  console.log('🧹 Starting Supabase database cleanup...');
  
  try {
    await safeDelete(() => prisma.notification.deleteMany({}), 'notifications');
    await safeDelete(() => prisma.userSession.deleteMany({}), 'user_sessions');
    await safeDelete(() => prisma.user.deleteMany({}), 'users');
    await safeDelete(() => prisma.employee.deleteMany({}), 'employees');
    await safeDelete(() => prisma.branch.deleteMany({}), 'branches');
    await safeDelete(() => prisma.department.deleteMany({}), 'departments');
    await safeDelete(() => prisma.tenant.deleteMany({}), 'tenants');

    console.log('🎉 Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();