// Script to show current managerId for each branch and try to resolve to Employee and User
// Run with: npx ts-node scripts/checkBranchManagerAssignments.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();

  for (const branch of branches) {
    const managerId = branch.managerId;
    let managerUser: any = null;
    let managerEmployee: any = null;
    if (managerId) {
      managerUser = await prisma.user.findUnique({ where: { id: managerId } });
      if (managerUser && managerUser.employeeId) {
        managerEmployee = await prisma.employee.findUnique({ where: { id: managerUser.employeeId } });
      }
    }
    console.log(`Branch: ${branch.name}`);
    console.log(`  managerId (User ID): ${managerId || 'None'}`);
    if (managerUser) {
      console.log(`  Manager User: ${managerUser.firstName} ${managerUser.lastName} (${managerUser.email})`);
      console.log(`  Manager User Role: ${managerUser.role}`);
      console.log(`  Manager User's employeeId: ${managerUser.employeeId || 'None'}`);
    } else {
      console.log('  No User found for managerId');
    }
    if (managerEmployee) {
      console.log(`  Manager Employee: ${managerEmployee.firstName} ${managerEmployee.lastName} (${managerEmployee.employeeNumber})`);
      console.log(`  Manager Employee UUID: ${managerEmployee.id}`);
    } else {
      console.log('  No Employee found for managerUser.employeeId');
    }
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
