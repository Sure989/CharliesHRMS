import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../src/utils/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to grant all permissions to admin users...');

  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
    },
  });

  if (adminUsers.length === 0) {
    console.log('No admin users found.');
    return;
  }

  for (const admin of adminUsers) {
    const result = await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: {
        permissions: ALL_PERMISSIONS,
      },
    });
    console.log(`Granted all permissions to admin: ${result.email}`);
  }

  console.log('Successfully granted all permissions to all admin users.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
