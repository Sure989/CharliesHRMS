const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardData() {
  try {
    console.log('Testing dashboard data...');
    
    // Test basic counts
    const [employees, users, departments, branches] = await Promise.all([
      prisma.employee.count(),
      prisma.user.count(),
      prisma.department.count(),
      prisma.branch.count()
    ]);
    
    console.log('Basic counts:');
    console.log('- Employees:', employees);
    console.log('- Users:', users);
    console.log('- Departments:', departments);
    console.log('- Branches:', branches);
    
    // Test leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      take: 5,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true } }
      }
    });
    
    console.log('\nLeave requests sample:', leaveRequests.length);
    
    // Test salary advances
    const salaryAdvances = await prisma.salaryAdvanceRequest.findMany({
      take: 5,
      include: {
        employee: { select: { firstName: true, lastName: true } }
      }
    });
    
    console.log('Salary advances sample:', salaryAdvances.length);
    
    console.log('\nDashboard data test completed successfully!');
    
  } catch (error) {
    console.error('Dashboard data test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardData();