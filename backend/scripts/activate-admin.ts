import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateAdmin() {
  const email = 'admin@charlieshrms.com'; // Change to your admin email if different
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { status: 'ACTIVE' },
    });
    console.log(`User ${email} activated. Status: ${user.status}`);
  } catch (error) {
    console.error('Error activating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAdmin();
