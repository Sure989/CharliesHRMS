// Script to list all branches, their manager, and the manager's role
// Run with: npx ts-node scripts/listBranchManagers.ts


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();

  for (const branch of branches) {
    let managerUser: any = null;
    let managerEmployee: any = null;
    if (branch.managerId) {
      managerUser = await prisma.user.findUnique({
        where: { id: branch.managerId },
      });
      if (managerUser && managerUser.employeeId) {
        managerEmployee = await prisma.employee.findUnique({
          where: { id: managerUser.employeeId },
        });
      }
    }
    const managerName = managerUser ? `${managerUser.firstName} ${managerUser.lastName}` : 'None';
    const managerRole = managerUser?.role || 'None';
    const managerUserId = managerUser?.id || 'None';
    const managerEmployeeNumber = managerEmployee?.employeeNumber || 'None';
    const managerEmployeeId = managerEmployee?.id || 'None';
    console.log(`Branch: ${branch.name}`);
    console.log(`  Manager Name: ${managerName}`);
    console.log(`  Manager User ID: ${managerUserId}`);
    console.log(`  Manager Role: ${managerRole}`);
    console.log(`  Manager Employee Number: ${managerEmployeeNumber}`);
    console.log(`  Manager Employee UUID: ${managerEmployeeId}`);
    console.log('---');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
