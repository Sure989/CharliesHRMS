// Script to print all employees for a given branchId and tenantId
import { prisma } from '../src/lib/prisma';

const branchId = process.argv[2]; // Pass as first argument
const tenantId = process.argv[3]; // Pass as second argument

if (!branchId || !tenantId) {
  console.error('Usage: node printBranchEmployees.js <branchId> <tenantId>');
  process.exit(1);
}

async function main() {
  const employees = await prisma.employee.findMany({
    where: {
      branchId,
      tenantId,
    },
  });
  console.log(`Employees for branchId=${branchId}, tenantId=${tenantId}:`);
  if (employees.length === 0) {
    console.log('No employees found.');
  } else {
    employees.forEach((emp) => {
      console.log({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        branchId: emp.branchId,
        tenantId: emp.tenantId,
        status: emp.status,
      });
    });
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  prisma.$disconnect();
});
