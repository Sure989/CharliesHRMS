// Script to list all branches, their managerUserId, manager user details, and all employees in the branch
// Run with: npx ts-node backend/scripts/listBranchManagersWithEmployee.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();

  console.log('Branch Manager and Employees:');
  for (const branch of branches) {
    let managerUser: any = null;
    if (branch.managerUserId) {
      managerUser = await prisma.user.findUnique({
        where: { id: branch.managerUserId },
        include: { employee: true }
      });
    }
    const employees = await prisma.employee.findMany({
      where: { branchId: branch.id }
    });

    console.log(`Branch: ${branch.name}`);
    console.log(`  managerUserId: ${branch.managerUserId}`);
    if (managerUser) {
      const mu = managerUser as any;
      console.log(`  Manager User: ${mu.firstName} ${mu.lastName} (User ID: ${mu.id}, Email: ${mu.email})`);
      if (mu.employee) {
        const emp = mu.employee as any;
        console.log(`  Linked Employee: ${emp.firstName} ${emp.lastName} (Employee ID: ${emp.id})`);
      } else {
        console.log('  No linked employee for this user.');
      }
    } else {
      console.log('  No managerUserId assigned or user not found.');
    }
    console.log('  Employees in Branch:');
    for (const emp of employees) {
      const e = emp as any;
      console.log(`    - ${e.firstName} ${e.lastName} (Employee ID: ${e.id})`);
    }
    console.log('---');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());