// Script to check branch manager assignments for all branches and list employees per branch
// Usage: Run with `npx ts-node backend/scripts/checkBranchManagers.ts`

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();

  for (const branch of branches) {
    console.log(`Branch: ${branch.name} (ID: ${branch.id})`);
    if (branch.managerUserId) {
      const manager = await prisma.user.findUnique({ where: { id: branch.managerUserId } });
      if (manager) {
        console.log(`  Manager: ${manager.firstName} ${manager.lastName} (UserID: ${manager.id}, Role: ${manager.role})`);
      } else {
        console.log('  Manager: [User not found]');
      }
    } else {
      console.log('  Manager: [Not assigned]');
    }
    const employees = await prisma.employee.findMany({
      where: { branchId: branch.id },
      include: { user: true },
    });
    if (employees.length > 0) {
      console.log('  Employees:');
      for (const emp of employees) {
        console.log(`    - ${emp.firstName} ${emp.lastName} (EmployeeID: ${emp.id}, UserID: ${emp.user?.id || 'N/A'}, Role: ${emp.user?.role || 'N/A'})`);
      }
    } else {
      console.log('  Employees: [None]');
    }
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
