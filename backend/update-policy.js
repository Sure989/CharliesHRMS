const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePolicy() {
  try {
    // Update existing policy for the default tenant
    const updated = await prisma.salaryAdvancePolicy.updateMany({
      where: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        isActive: true,
      },
      data: {
        name: 'Monthly Salary Advance Policy',
        description: 'Employees can request up to 25% of their basic salary per month with unlimited requests until limit is reached. All advances are deducted from salary at month end.',
        maxAdvancePercentage: 25,
        maxAdvanceAmount: null, // No fixed cap - only percentage based
        minServiceMonths: 0, // No minimum service requirement
        maxAdvancesPerYear: 999, // Unlimited requests per year
        interestRate: 0, // No interest
        requiresApproval: true, // HR approval required
        autoApprove: false, // Manual approval needed
        monthlyDeductionPercentage: 100, // Full deduction at month end
      },
    });

    console.log('Updated policy:', updated);
    
    // Verify the update
    const policy = await prisma.salaryAdvancePolicy.findFirst({
      where: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        isActive: true,
      },
    });
    
    console.log('Current policy:', policy);
    
  } catch (error) {
    console.error('Error updating policy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePolicy();
