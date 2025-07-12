import { prisma } from '../src/index';

async function main() {
  const employees = await prisma.employee.findMany({
    where: { user: null },
  });

  for (const emp of employees) {
    // Check if a user already exists for this employee (should not, but double check)
    const existingUser = await prisma.user.findFirst({ where: { employeeId: emp.id } });
    if (existingUser) continue;

    // Create a user for the employee
    await prisma.user.create({
      data: {
        email: emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        passwordHash: '', // Set a default or random password, or require reset
        role: 'EMPLOYEE',
        status: emp.status || 'ACTIVE',
        tenantId: emp.tenantId,
        employeeId: emp.id,
      },
    });
    console.log(`Created user for employee ${emp.firstName} ${emp.lastName} (${emp.email})`);
  }

  console.log('Done creating users for employees.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
