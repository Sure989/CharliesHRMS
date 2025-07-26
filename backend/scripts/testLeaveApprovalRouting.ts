import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLeaveRouting() {
  const branches = await prisma.branch.findMany({});
  for (const branch of branches) {
    const managerUserId = branch.managerUserId;
    if (managerUserId) {
      const manager = await prisma.user.findUnique({ where: { id: managerUserId } });
      console.log(`Branch: ${branch.name}, Manager User ID: ${managerUserId}, Manager Name: ${manager ? manager.firstName + ' ' + manager.lastName : 'Not found'}`);
    } else {
      console.log(`Branch: ${branch.name}, Manager User ID: Not set`);
    }
  }
  await prisma.$disconnect();
}

testLeaveRouting().catch(console.error);
