// Script to check leave requests for employees in Soho branch and report missing or mismatched relations
// Usage: npx ts-node checkSohoLeaveRequests.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Find Soho branch (case-insensitive)
  const sohoBranch = await prisma.branch.findFirst({
    where: { name: { equals: 'Soho', mode: 'insensitive' } },
  });
  if (!sohoBranch) {
    console.error('No branch named "Soho" found.');
    await prisma.$disconnect();
    return;
  }

  // Find employees assigned to Soho branch
  const employees = await prisma.employee.findMany({
    where: { branchId: sohoBranch.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (employees.length === 0) {
    console.warn('No employees assigned to Soho branch.');
    await prisma.$disconnect();
    return;
  }

  // Find leave requests for these employees
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: { employeeId: { in: employees.map(e => e.id) } },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, branchId: true } },
      // Optionally include branch via employee
    },
  });

  // Report leave requests with missing or mismatched employee/branch
  let found = false;
  for (const req of leaveRequests) {
    const emp = req.employee;
    if (!emp) {
      console.log(`LeaveRequest ${req.id} has missing employee relation.`);
      found = true;
      continue;
    }
    if (emp.branchId !== sohoBranch.id) {
      console.log(`LeaveRequest ${req.id} for ${emp.firstName} ${emp.lastName} (${emp.id}) is NOT assigned to Soho branch.`);
      found = true;
    } else {
      console.log(`LeaveRequest ${req.id} for ${emp.firstName} ${emp.lastName} (${emp.id}) is correctly assigned to Soho branch.`);
    }
  }
  if (!found) {
    console.log('All leave requests for Soho branch employees are correctly assigned.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
