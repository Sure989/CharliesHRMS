// Script to test fetching team overview data for SOHO branch
// Run with: npx ts-node backend/scripts/testOpsManagerTeamOverview.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find SOHO branch
  const branch = await prisma.branch.findFirst({ where: { name: 'SOHO' } });
  if (!branch) {
    console.log('SOHO branch not found');
    return;
  }
  // Find manager user
  let managerUser: any = null;
  if (branch.managerUserId) {
    managerUser = await prisma.user.findUnique({
      where: { id: branch.managerUserId },
      include: { employee: true }
    });
  }
  // Find all employees in SOHO branch
  const employees = await prisma.employee.findMany({ where: { branchId: branch.id } });

  console.log(`SOHO Branch Team Overview:`);
  if (managerUser) {
    const mu = managerUser as any;
    console.log(`Manager: ${mu.firstName} ${mu.lastName} (User ID: ${mu.id}, Email: ${mu.email})`);
    if (mu.employee) {
      const emp = mu.employee as any;
      console.log(`Manager's Employee Record: ${emp.firstName} ${emp.lastName} (Employee ID: ${emp.id})`);
    }
  } else {
    console.log('No managerUserId assigned or user not found.');
  }
  console.log('Employees in SOHO Branch:');
  for (const emp of employees) {
    const e = emp as any;
    console.log(`- ${e.firstName} ${e.lastName} (Employee ID: ${e.id})`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
