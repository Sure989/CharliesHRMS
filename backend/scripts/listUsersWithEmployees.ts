// Script to list all users and their linked employee records
// Run with: npx ts-node scripts/listUsersWithEmployees.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    let employee: Awaited<ReturnType<typeof prisma.employee.findUnique>> = null;
    if (user.employeeId) {
      employee = await prisma.employee.findUnique({ where: { id: user.employeeId } });
    }
    console.log(`User: ${user.firstName} ${user.lastName} <${user.email}>`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  employeeId: ${user.employeeId || 'None'}`);
    if (employee) {
      console.log(`  Employee Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`  Employee Number: ${employee.employeeNumber}`);
      console.log(`  Employee UUID: ${employee.id}`);
      console.log(`  Branch ID: ${employee.branchId || 'None'}`);
    } else {
      console.log('  No Employee record linked');
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
