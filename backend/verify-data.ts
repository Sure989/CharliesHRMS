import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData(): Promise<void> {
  try {
    console.log('=== Database Verification ===\n');

    // Check employee count
    const employeeCount = await prisma.employee.count();
    console.log(`Total Employees: ${employeeCount}`);

    // Check payroll records
    const payrollCount = await prisma.payroll.count();
    console.log(`Total Payroll Records: ${payrollCount}`);

    // Check payroll statistics
    const payrolls = await prisma.payroll.findMany({
      select: {
        basicSalary: true,
        grossSalary: true,
        totalDeductions: true,
        netSalary: true,
        status: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            salary: true
          }
        }
      }
    });

    const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0);

    console.log(`\nPayroll Summary:`);
    console.log(`Total Gross Pay: KES ${totalGross.toLocaleString()}`);
    console.log(`Total Net Pay: KES ${totalNet.toLocaleString()}`);
    console.log(`Total Deductions: KES ${totalDeductions.toLocaleString()}`);

    // Check user-employee linkage
    const usersWithEmployees = await prisma.user.count({
      where: { employeeId: { not: null } }
    });
    const usersWithoutEmployees = await prisma.user.count({
      where: { employeeId: null }
    });

    console.log(`\nUser-Employee Linkage:`);
    console.log(`Users linked to employees: ${usersWithEmployees}`);
    console.log(`Users without employee link: ${usersWithoutEmployees}`);

    // Sample payroll records
    console.log(`\nSample Payroll Records (first 5):`);
    payrolls.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.employee.firstName} ${p.employee.lastName} - Gross: KES ${p.grossSalary}, Net: KES ${p.netSalary}, Status: ${p.status}`);
    });

  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
