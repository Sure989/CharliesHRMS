// Script to ensure branch name and employee assignments are correct for Soho branch
// Usage: npx ts-node fixSohoBranch.ts

import { PrismaClient, Branch, Employee } from '@prisma/client';
const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Find the Soho branch (case-insensitive)
  const sohoBranch: Branch | null = await prisma.branch.findFirst({
    where: {
      name: { equals: 'Soho', mode: 'insensitive' },
    },
  });

  if (!sohoBranch) {
    console.error('No branch named "Soho" found. Please check your database.');
    await prisma.$disconnect();
    return;
  }

  // 2. Update branch name to exact 'Soho' (if needed)
  if (sohoBranch.name !== 'Soho') {
    await prisma.branch.update({
      where: { id: sohoBranch.id },
      data: { name: 'Soho' },
    });
    console.log('Branch name updated to "Soho".');
  } else {
    console.log('Branch name is already "Soho".');
  }

  // 3. List employees assigned to Soho branch
  type SimpleEmployee = { id: string; firstName: string; lastName: string };
  const employees: SimpleEmployee[] = await prisma.employee.findMany({
    where: { branchId: sohoBranch.id },
    select: { id: true, firstName: true, lastName: true },
  });

  if (employees.length === 0) {
    console.warn('No employees assigned to Soho branch.');
  } else {
    console.log('Employees assigned to Soho branch:');
    employees.forEach(e => console.log(`- ${e.firstName} ${e.lastName} (${e.id})`));
  }

  // 4. Optionally, assign employees to Soho branch (uncomment and edit IDs below)
  // const employeeIdsToAssign: string[] = ['EMPLOYEE_ID_1', 'EMPLOYEE_ID_2'];
  // await prisma.employee.updateMany({
  //   where: { id: { in: employeeIdsToAssign } },
  //   data: { branchId: sohoBranch.id },
  // });
  // console.log('Selected employees assigned to Soho branch.');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
