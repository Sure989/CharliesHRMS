import prisma from '../lib/prisma';

export interface AnalyticsData {
  [key: string]: any;
}

export interface DashboardMetrics {
  employees: {
    total: number;
    active: number;
    inactive: number;
    newHires: number;
    branchDistribution: Array<{
      branch: string;
      count: number;
      percentage: number;
    }>;
  };
  leave: {
    pendingRequests: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    totalDaysRequested: number;
    leaveTypeBreakdown: Array<{
      leaveType: string;
      totalRequests: number;
      totalDays: number;
      averageDuration: number;
    }>;
    upcomingLeaves: Array<any>;
    departmentLeaveStats: Array<any>;
  };
  salaryAdvances: {
    pendingRequests: number;
    approvedThisMonth: number;
    totalOutstanding: number;
    averageAmount: number;
    repaymentRate: number;
    monthlyTrend: Array<any>;
    riskMetrics: {
      highRiskEmployees: number;
      overduePayments: number;
      defaultRate: number;
    };
  };
  performance: {
    overallScore: number;
    completedReviews: number;
    pendingReviews: number;
    improvementPlans: number;
    topPerformers: Array<any>;
    departmentScores: Array<any>;
  };
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalBranches: number;
  pendingLeaveRequests: number;
  upcomingReviews: number;
  payrollCosts: {
    currentMonth: number;
    previousMonth: number;
    percentageChange: number;
  };
  leaveUtilization: {
    totalDaysAllocated: number;
    totalDaysUsed: number;
    utilizationRate: number;
  };
}

/**
 * Get dashboard metrics for overview
 */
export async function getDashboardMetrics(tenantId: string = 'default'): Promise<any> {
  // ...existing code...
  
  // If tenantId is 'default', get the first available tenant
  if (tenantId === 'default') {
    const firstTenant = await prisma.tenant.findFirst({ select: { id: true } });
    if (firstTenant) {
      tenantId = firstTenant.id;
      // ...existing code...
    }
  }
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const currentYear = currentDate.getFullYear();

  // --- Real data (existing) ---
  // ...existing code...
  const totalEmployees = await prisma.employee.count({ where: tenantId ? { tenantId } : {} });
  // ...existing code...
  const activeEmployees = await prisma.employee.count({ where: tenantId ? { tenantId, status: 'ACTIVE' } : { status: 'ACTIVE' } });
  // ...existing code...
  const totalDepartments = await prisma.department.count({ where: tenantId ? { tenantId, status: 'ACTIVE' } : { status: 'ACTIVE' } });
  // ...existing code...
  const totalBranches = await prisma.branch.count({ where: tenantId ? { tenantId, status: 'ACTIVE' } : { status: 'ACTIVE' } });
  // ...existing code...
  const pendingLeaveRequests = await prisma.leaveRequest.count({ where: tenantId ? { tenantId, status: 'PENDING' } : { status: 'PENDING' } });
  // ...existing code...
  const upcomingReviews = await prisma.performanceReview.count({ where: tenantId ? { tenantId, status: { in: ['DRAFT', 'IN_PROGRESS'] } } : { status: { in: ['DRAFT', 'IN_PROGRESS'] } } });
  // ...existing code...
  const currentMonthPayroll = await prisma.payroll.aggregate({ where: tenantId ? { tenantId, createdAt: { gte: currentMonth } } : { createdAt: { gte: currentMonth } }, _sum: { grossSalary: true } });
  const previousMonthPayroll = await prisma.payroll.aggregate({ where: tenantId ? { tenantId, createdAt: { gte: previousMonth, lt: currentMonth } } : { createdAt: { gte: previousMonth, lt: currentMonth } }, _sum: { grossSalary: true } });
  const currentMonthCost = currentMonthPayroll._sum.grossSalary || 0;
  const previousMonthCost = previousMonthPayroll._sum.grossSalary || 0;
  const percentageChange = previousMonthCost > 0 ? Math.round(((currentMonthCost - previousMonthCost) / previousMonthCost) * 100 * 100) / 100 : 0;
  const leaveBalances = await prisma.leaveBalance.aggregate({ where: tenantId ? { tenantId, year: currentYear } : { year: currentYear }, _sum: { allocated: true, used: true } });
  const totalDaysAllocated = leaveBalances._sum.allocated || 0;
  const totalDaysUsed = leaveBalances._sum.used || 0;
  const utilizationRate = totalDaysAllocated > 0 ? Math.round((totalDaysUsed / totalDaysAllocated) * 100 * 100) / 100 : 0;
  const branches = await prisma.branch.findMany({ where: tenantId ? { tenantId, status: 'ACTIVE' } : { status: 'ACTIVE' }, select: { id: true, name: true } });
  const branchDistribution = await Promise.all(branches.map(async (branch) => {
    const count = await prisma.employee.count({ where: tenantId ? { tenantId, branchId: branch.id, status: 'ACTIVE' } : { branchId: branch.id, status: 'ACTIVE' } });
    const percentage = activeEmployees > 0 ? (count / activeEmployees) * 100 : 0;
    return { branch: branch.name, count, percentage: Math.round(percentage * 100) / 100 }; // Round to 2 decimal places
  }));
  const newHires = await prisma.employee.count({ where: tenantId ? { tenantId, hireDate: { gte: currentMonth } } : { hireDate: { gte: currentMonth } } });
  // ...existing code...
  const pendingSalaryAdvances = await prisma.salaryAdvanceRequest.count({ where: tenantId ? { tenantId, status: { in: ['PENDING', 'FORWARDEDTOHR'] } } : { status: { in: ['PENDING', 'FORWARDEDTOHR'] } } });
  // ...existing code...
  const approvedSalaryAdvancesThisMonth = await prisma.salaryAdvanceRequest.count({ where: tenantId ? { tenantId, status: 'APPROVED', createdAt: { gte: currentMonth } } : { status: 'APPROVED', createdAt: { gte: currentMonth } } });
  const totalOutstandingSalaryAdvances = await prisma.salaryAdvanceRequest.aggregate({ where: tenantId ? { tenantId, status: 'APPROVED' } : { status: 'APPROVED' }, _sum: { outstandingBalance: true } });

  // Calculate real department distribution
  const departments = await prisma.department.findMany({ 
    where: tenantId ? { tenantId, status: 'ACTIVE' } : { status: 'ACTIVE' }, 
    select: { id: true, name: true } 
  });
  const departmentDistribution = await Promise.all(departments.map(async (dept) => {
    const count = await prisma.employee.count({ 
      where: tenantId ? { tenantId, departmentId: dept.id, status: 'ACTIVE' } : { departmentId: dept.id, status: 'ACTIVE' } 
    });
    const percentage = activeEmployees > 0 ? (count / activeEmployees) * 100 : 0;
    return { 
      department: dept.name, 
      count, 
      percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
    };
  }));

  // Calculate real recent hires (last 30 days)
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentHires = await prisma.employee.findMany({
    where: { 
      tenantId, 
      hireDate: { gte: thirtyDaysAgo },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      hireDate: true,
      department: { select: { name: true } }
    },
    orderBy: { hireDate: 'desc' },
    take: 10
  }).then(hires => hires.map(hire => ({
    id: hire.id,
    firstName: hire.firstName,
    lastName: hire.lastName,
    position: hire.position || 'Not specified',
    department: hire.department?.name || 'Not assigned',
    hireDate: hire.hireDate?.toISOString().split('T')[0] || ''
  })));

  // Calculate real payroll data
  const currentPeriodPayroll = await prisma.payroll.findFirst({
    where: { tenantId, createdAt: { gte: currentMonth } },
    include: { payrollPeriod: true },
    orderBy: { createdAt: 'desc' }
  });

  const totalNetPayCurrent = await prisma.payroll.aggregate({
    where: { tenantId, createdAt: { gte: currentMonth } },
    _sum: { netSalary: true }
  });

  const totalDeductionsCurrent = await prisma.payroll.aggregate({
    where: { tenantId, createdAt: { gte: currentMonth } },
    _sum: { totalDeductions: true }
  });

  // Calculate payroll breakdown using PayrollItems
  const payrollItemsSummary = await prisma.payrollItem.groupBy({
    by: ['category'],
    where: { 
      tenantId, 
      createdAt: { gte: currentMonth }
    },
    _sum: { amount: true }
  });

  const getSumForCategory = (category: string) => {
    return payrollItemsSummary.find(item => item.category === category)?._sum.amount || 0;
  };

  const payroll = {
    currentPeriod: {
      id: currentPeriodPayroll?.id || '',
      name: currentPeriodPayroll?.payrollPeriod 
        ? `Pay Period ${currentPeriodPayroll.payrollPeriod.startDate.toISOString().split('T')[0]} - ${currentPeriodPayroll.payrollPeriod.endDate.toISOString().split('T')[0]}` 
        : 'No current period',
      totalEmployees: totalEmployees,
      totalGrossPay: currentMonthCost,
      totalNetPay: totalNetPayCurrent._sum.netSalary || 0,
      totalDeductions: totalDeductionsCurrent._sum.totalDeductions || 0,
      status: currentPeriodPayroll?.status || 'UNKNOWN',
    },
    monthlyTrend: [], // TODO: Implement detailed monthly trend when needed
    upcomingPayments: [], // TODO: Implement upcoming payments when needed
    costBreakdown: {
      salaries: getSumForCategory('SALARY'),
      statutory: getSumForCategory('STATUTORY'),
      benefits: getSumForCategory('BENEFIT'),
      overtime: getSumForCategory('OVERTIME'),
    },
  };
  // Calculate real leave analytics
  const leaveTypes = await prisma.leaveType.findMany({
    where: { tenantId },
    select: { id: true, name: true }
  });

  const leaveTypeBreakdown = await Promise.all(leaveTypes.map(async (type) => {
    const requests = await prisma.leaveRequest.count({
      where: { tenantId, leaveTypeId: type.id, createdAt: { gte: currentMonth } }
    });
    const totalDays = await prisma.leaveRequest.aggregate({
      where: { tenantId, leaveTypeId: type.id, createdAt: { gte: currentMonth } },
      _sum: { totalDays: true }
    });
    return {
      leaveType: type.name,
      totalRequests: requests,
      totalDays: totalDays._sum.totalDays || 0,
      averageDuration: requests > 0 ? (totalDays._sum.totalDays || 0) / requests : 0
    };
  }));

  // Calculate upcoming leaves (next 30 days)
  const nextMonth = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingLeaves = await prisma.leaveRequest.findMany({
    where: {
      tenantId,
      status: 'APPROVED',
      startDate: { gte: currentDate, lte: nextMonth }
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      leaveType: { select: { name: true } }
    },
    orderBy: { startDate: 'asc' },
    take: 10
  }).then(leaves => leaves.map(leave => ({
    employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
    leaveType: leave.leaveType.name,
    startDate: leave.startDate.toISOString().split('T')[0],
    endDate: leave.endDate.toISOString().split('T')[0],
    days: leave.totalDays
  })));

  // Calculate department leave statistics
  const departmentLeaveStats = await Promise.all(departments.map(async (dept) => {
    const pendingRequests = await prisma.leaveRequest.count({
      where: { 
        tenantId, 
        employee: { departmentId: dept.id },
        status: 'PENDING'
      }
    });
    const approvedDays = await prisma.leaveRequest.aggregate({
      where: {
        tenantId,
        employee: { departmentId: dept.id },
        status: 'APPROVED',
        createdAt: { gte: currentMonth }
      },
      _sum: { totalDays: true }
    });
    return {
      department: dept.name,
      pendingRequests,
      approvedDays: approvedDays._sum.totalDays || 0,
      utilizationRate: 0 // TODO: Calculate based on allocated vs used days
    };
  }));

  // Calculate total days requested this month
  const totalDaysRequestedResult = await prisma.leaveRequest.aggregate({
    where: { tenantId, createdAt: { gte: currentMonth } },
    _sum: { totalDays: true }
  });
  // Calculate real salary advance analytics
  const averageAdvanceAmount = await prisma.salaryAdvanceRequest.aggregate({
    where: { tenantId, status: 'APPROVED' },
    _avg: { requestedAmount: true }
  });

  const totalRepaidAmount = await prisma.salaryAdvanceRequest.aggregate({
    where: { tenantId, status: 'APPROVED' },
    _sum: { totalRepaid: true }
  });

  const totalAdvanceAmount = await prisma.salaryAdvanceRequest.aggregate({
    where: { tenantId, status: 'APPROVED' },
    _sum: { approvedAmount: true }
  });

  const repaymentRate = (totalAdvanceAmount._sum.approvedAmount || 0) > 0 
    ? Math.round(((totalRepaidAmount._sum.totalRepaid || 0) / (totalAdvanceAmount._sum.approvedAmount || 1)) * 100 * 100) / 100
    : 0;

  // Calculate risk metrics
  const highRiskEmployees = await prisma.salaryAdvanceRequest.groupBy({
    by: ['employeeId'],
    where: { 
      tenantId, 
      status: 'APPROVED',
      outstandingBalance: { gt: 0 }
    },
    having: {
      outstandingBalance: { _sum: { gt: 50000 } } // High risk if outstanding > 50k
    }
  }).then(results => results.length);

  const overduePayments = await prisma.salaryAdvanceRequest.count({
    where: {
      tenantId,
      status: 'APPROVED',
      outstandingBalance: { gt: 0 },
      repaymentEndDate: { lt: currentDate }
    }
  });

  const defaultedPayments = await prisma.salaryAdvanceRequest.count({
    where: {
      tenantId,
      status: 'DEFAULTED'
    }
  });

  const totalAdvancesCount = await prisma.salaryAdvanceRequest.count({
    where: { tenantId }
  });

  const defaultRate = totalAdvancesCount > 0 ? Math.round((defaultedPayments / totalAdvancesCount) * 100 * 100) / 100 : 0;

  const salaryAdvanceRiskMetrics = {
    highRiskEmployees,
    overduePayments,
    defaultRate,
  };
  // Calculate real performance analytics
  const completedReviews = await prisma.performanceReview.count({
    where: { tenantId, status: 'COMPLETED', updatedAt: { gte: currentMonth } },
  });

  const averageRating = await prisma.performanceReview.aggregate({
    where: { tenantId, status: 'COMPLETED' },
    _avg: { overallRating: true }
  });

  const improvementPlansCount = await prisma.performanceReview.count({
    where: { 
      tenantId, 
      status: 'COMPLETED',
      overallRating: { lt: 3.0 } // Assuming ratings below 3.0 need improvement plans
    }
  });

  // Calculate top performers (top 10% by rating)
  const topPerformers = await prisma.performanceReview.findMany({
    where: { tenantId, status: 'COMPLETED' },
    include: {
      employee: { select: { firstName: true, lastName: true, position: true } }
    },
    orderBy: { overallRating: 'desc' },
    take: Math.max(1, Math.floor(activeEmployees * 0.1)) // Top 10%
  }).then(reviews => reviews.map(review => ({
    employeeName: `${review.employee.firstName} ${review.employee.lastName}`,
    position: review.employee.position || 'Not specified',
    rating: review.overallRating || 0,
    reviewDate: review.updatedAt.toISOString().split('T')[0]
  })));

  // Calculate department performance scores
  const departmentScores = await Promise.all(departments.map(async (dept) => {
    const deptRating = await prisma.performanceReview.aggregate({
      where: {
        tenantId,
        status: 'COMPLETED',
        employee: { departmentId: dept.id }
      },
      _avg: { overallRating: true },
      _count: { overallRating: true }
    });
    return {
      department: dept.name,
      averageScore: deptRating._avg.overallRating || 0,
      reviewsCount: deptRating._count.overallRating || 0
    };
  }));
  // Removed unused variable: alerts

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: totalEmployees - activeEmployees,
      newHires,
      recentHires,
      departmentDistribution,
      branchDistribution,
    },
    payroll,
    leave: {
      pendingRequests: pendingLeaveRequests,
      approvedThisMonth: await prisma.leaveRequest.count({
        where: { tenantId, status: 'APPROVED', updatedAt: { gte: currentMonth } },
      }),
      rejectedThisMonth: await prisma.leaveRequest.count({
        where: { tenantId, status: 'REJECTED', updatedAt: { gte: currentMonth } },
      }),
      totalDaysRequested: totalDaysRequestedResult._sum.totalDays || 0,
      leaveTypeBreakdown,
      upcomingLeaves,
      departmentLeaveStats,
    },
    salaryAdvances: {
      pendingRequests: pendingSalaryAdvances,
      approvedThisMonth: approvedSalaryAdvancesThisMonth,
      totalOutstanding: totalOutstandingSalaryAdvances._sum.outstandingBalance || 0,
      averageAmount: averageAdvanceAmount._avg?.requestedAmount || 0,
      repaymentRate,
      monthlyTrend: [], // TODO: Implement detailed monthly trend when needed
      riskMetrics: salaryAdvanceRiskMetrics,
    },
    performance: {
      overallScore: averageRating._avg?.overallRating || 0,
      completedReviews,
      pendingReviews: upcomingReviews,
      improvementPlans: improvementPlansCount,
      topPerformers,
      departmentScores,
    },
    alerts: [], // TODO: Implement alert system when needed
    // ...existing code for legacy fields (for backward compatibility)...
    totalEmployees,
    activeEmployees,
    totalDepartments,
    totalBranches,
    pendingLeaveRequests,
    upcomingReviews,
    payrollCosts: {
      currentMonth: currentMonthCost,
      previousMonth: previousMonthCost,
      percentageChange,
    },
    leaveUtilization: {
      totalDaysAllocated,
      totalDaysUsed,
      utilizationRate,
    },
  };
}

/**
 * Employee analytics interface
 */
export interface EmployeeAnalytics {
  headcount: {
    total: number;
    byDepartment: Array<{ department: string; count: number }>;
    byBranch: Array<{ branch: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  demographics: {
    averageTenure: number;
    newHires: number;
    terminations: number;
    turnoverRate: number;
  };
  growth: Array<{
    month: string;
    hires: number;
    terminations: number;
    netGrowth: number;
  }>;
}

/**
 * Get employee analytics
 */
export async function getEmployeeAnalytics(tenantId: string): Promise<EmployeeAnalytics> {
  const currentDate = new Date();
  const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

  // Headcount analytics
  const totalEmployees = await prisma.employee.count({
    where: { tenantId },
  });

  const employeesByDepartment = await prisma.employee.groupBy({
    by: ['departmentId'],
    where: { tenantId, status: 'ACTIVE' },
    _count: { id: true },
  });

  const employeesByBranch = await prisma.employee.groupBy({
    by: ['branchId'],
    where: { tenantId, status: 'ACTIVE' },
    _count: { id: true },
  });

  const employeesByStatus = await prisma.employee.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: { id: true },
  });

  // Demographics
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    select: { hireDate: true, terminationDate: true, status: true },
  });

  const activeEmployees = employees.filter((emp: any) => emp.status === 'ACTIVE');
  const averageTenure = activeEmployees.length > 0
    ? activeEmployees.reduce((sum: number, emp: any) => {
        const tenure = (currentDate.getTime() - emp.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return sum + tenure;
      }, 0) / activeEmployees.length
    : 0;

  const newHires = await prisma.employee.count({
    where: {
      tenantId,
      hireDate: { gte: oneYearAgo },
    },
  });

  const terminations = await prisma.employee.count({
    where: {
      tenantId,
      terminationDate: { gte: oneYearAgo },
    },
  });

  const turnoverRate = totalEmployees > 0 ? (terminations / totalEmployees) * 100 : 0;

  // Growth trends (last 12 months)
  const growth = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

    const monthHires = await prisma.employee.count({
      where: {
        tenantId,
        hireDate: { gte: monthStart, lte: monthEnd },
      },
    });

    const monthTerminations = await prisma.employee.count({
      where: {
        tenantId,
        terminationDate: { gte: monthStart, lte: monthEnd },
      },
    });

    growth.push({
      month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      hires: monthHires,
      terminations: monthTerminations,
      netGrowth: monthHires - monthTerminations,
    });
  }

  return {
    headcount: {
      total: totalEmployees,
      byDepartment: employeesByDepartment.map((item: any) => ({
        department: item.department?.name || 'Unknown',
        count: item._count.id,
      })),
      byBranch: employeesByBranch.map((item: any) => ({
        branch: item.branch?.name || 'Unknown',
        count: item._count.id,
      })),
      byStatus: employeesByStatus.map((item: any) => ({
        status: item.status,
        count: item._count.id,
      })),
    },
    demographics: {
      averageTenure,
      newHires,
      terminations,
      turnoverRate,
    },
    growth,
  };
}

/**
 * Payroll analytics interface
 */
export interface PayrollAnalytics {
  summary: {
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    averageSalary: number;
  };
  byDepartment: Array<{
    department: string;
    totalGrossPay: number;
    averageSalary: number;
    employeeCount: number;
  }>;
  trends: Array<{
    month: string;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
  }>;
  taxBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

/**
 * Get payroll analytics
 */
export async function getPayrollAnalytics(tenantId: string, year?: number): Promise<PayrollAnalytics> {
  const targetYear = year || new Date().getFullYear();
  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear, 11, 31);

  // Summary
  const payrollSummary = await prisma.payroll.aggregate({
    where: {
      tenantId,
      createdAt: { gte: yearStart, lte: yearEnd },
    },
    _sum: {
      grossSalary: true,
      netSalary: true,
      totalDeductions: true,
    },
    _avg: {
      grossSalary: true,
    },
  });

  // By department
  const payrollByDepartment = await prisma.payroll.groupBy({
    by: ['employeeId'],
    where: {
      tenantId,
      createdAt: { gte: yearStart, lte: yearEnd },
    },
    _sum: { grossSalary: true },
    _avg: { grossSalary: true },
    _count: { id: true },
  });

  // Get department info for employees
  const departmentPayroll = await Promise.all(
    payrollByDepartment.map(async (item: any) => {
      const employee = await prisma.employee.findUnique({
        where: { id: item.employeeId },
        include: { department: { select: { name: true } } },
      });
      return {
        department: employee?.department.name || 'Unknown',
        grossSalary: item._sum.grossSalary || 0,
        avgSalary: item._avg.grossSalary || 0,
        count: item._count.id,
      };
    })
  );

  // Group by department
  const departmentGroups = departmentPayroll.reduce((acc: any, item) => {
    const dept = item.department;
    if (!acc[dept]) {
      acc[dept] = { totalGrossPay: 0, totalAvg: 0, employeeCount: 0 };
    }
    acc[dept].totalGrossPay += item.grossSalary;
    acc[dept].totalAvg += item.avgSalary;
    acc[dept].employeeCount += 1;
    return acc;
  }, {});

  const byDepartment = Object.entries(departmentGroups).map(([dept, data]: [string, any]) => ({
    department: dept,
    totalGrossPay: data.totalGrossPay,
    averageSalary: data.totalAvg / data.employeeCount,
    employeeCount: data.employeeCount,
  }));

  // Monthly trends
  const trends = [];
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(targetYear, month, 1);
    const monthEnd = new Date(targetYear, month + 1, 0);

    const monthlyPayroll = await prisma.payroll.aggregate({
      where: {
        tenantId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
      },
    });

    trends.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      totalGrossPay: monthlyPayroll._sum.grossSalary || 0,
      totalNetPay: monthlyPayroll._sum.netSalary || 0,
      totalDeductions: monthlyPayroll._sum.totalDeductions || 0,
    });
  }

  // Tax breakdown
  const taxBreakdown = await prisma.payrollItem.groupBy({
    by: ['category'],
    where: {
      tenantId,
      type: 'DEDUCTION',
      isStatutory: true,
    },
    _sum: { amount: true },
  });

  const totalTax = taxBreakdown.reduce((sum: number, item: any) => sum + (item._sum.amount || 0), 0);
  const taxBreakdownWithPercentage = taxBreakdown.map((item: any) => ({
    category: item.category,
    amount: item._sum.amount || 0,
    percentage: totalTax > 0 ? ((item._sum.amount || 0) / totalTax) * 100 : 0,
  }));

  return {
    summary: {
      totalGrossPay: payrollSummary._sum.grossSalary || 0,
      totalNetPay: payrollSummary._sum.netSalary || 0,
      totalDeductions: payrollSummary._sum.totalDeductions || 0,
      averageSalary: payrollSummary._avg.grossSalary || 0,
    },
    byDepartment,
    trends,
    taxBreakdown: taxBreakdownWithPercentage,
  };
}

/**
 * Leave analytics interface
 */
export interface LeaveAnalytics {
  summary: {
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    approvalRate: number;
  };
  byLeaveType: Array<{
    leaveType: string;
    totalRequests: number;
    totalDays: number;
    averageDuration: number;
  }>;
  utilization: Array<{
    department: string;
    allocatedDays: number;
    usedDays: number;
    utilizationRate: number;
  }>;
  trends: Array<{
    month: string;
    requests: number;
    days: number;
  }>;
}

/**
 * Get leave analytics
 */
export async function getLeaveAnalytics(tenantId: string, year?: number): Promise<LeaveAnalytics> {
  const targetYear = year || new Date().getFullYear();
  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear, 11, 31);

  // Summary
  const totalRequests = await prisma.leaveRequest.count({
    where: {
      tenantId,
      startDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const approvedRequests = await prisma.leaveRequest.count({
    where: {
      tenantId,
      status: 'APPROVED',
      startDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const pendingRequests = await prisma.leaveRequest.count({
    where: {
      tenantId,
      status: 'PENDING',
      startDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const rejectedRequests = await prisma.leaveRequest.count({
    where: {
      tenantId,
      status: 'REJECTED',
      startDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

  // By leave type
  const leaveByType = await prisma.leaveRequest.groupBy({
    by: ['leaveTypeId'],
    where: {
      tenantId,
      startDate: { gte: yearStart, lte: yearEnd },
    },
    _count: { id: true },
    _sum: { totalDays: true },
    _avg: { totalDays: true },
  });

  const byLeaveType = await Promise.all(
    leaveByType.map(async (item: any) => {
      const leaveType = await prisma.leaveType.findUnique({
        where: { id: item.leaveTypeId },
        select: { name: true },
      });
      return {
        leaveType: leaveType?.name || 'Unknown',
        totalRequests: item._count.id,
        totalDays: item._sum.totalDays || 0,
        averageDuration: item._avg.totalDays || 0,
      };
    })
  );

  // Utilization by department
  const departmentUtilization = await prisma.leaveBalance.groupBy({
    by: ['employeeId'],
    where: { tenantId, year: targetYear },
    _sum: {
      allocated: true,
      used: true,
    },
  });

  const utilizationByDept = await Promise.all(
    departmentUtilization.map(async (item: any) => {
      const employee = await prisma.employee.findUnique({
        where: { id: item.employeeId },
        include: { department: { select: { name: true } } },
      });
      return {
        department: employee?.department.name || 'Unknown',
        allocated: item._sum.allocated || 0,
        used: item._sum.used || 0,
      };
    })
  );

  const deptGroups = utilizationByDept.reduce((acc: any, item) => {
    const dept = item.department;
    if (!acc[dept]) {
      acc[dept] = { allocated: 0, used: 0 };
    }
    acc[dept].allocated += item.allocated;
    acc[dept].used += item.used;
    return acc;
  }, {});

  const utilization = Object.entries(deptGroups).map(([dept, data]: [string, any]) => ({
    department: dept,
    allocatedDays: data.allocated,
    usedDays: data.used,
    utilizationRate: data.allocated > 0 ? (data.used / data.allocated) * 100 : 0,
  }));

  // Monthly trends
  const trends = [];
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(targetYear, month, 1);
    const monthEnd = new Date(targetYear, month + 1, 0);

    const monthlyRequests = await prisma.leaveRequest.count({
      where: {
        tenantId,
        startDate: { gte: monthStart, lte: monthEnd },
      },
    });

    const monthlyDays = await prisma.leaveRequest.aggregate({
      where: {
        tenantId,
        startDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalDays: true },
    });

    trends.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      requests: monthlyRequests,
      days: monthlyDays._sum.totalDays || 0,
    });
  }

  return {
    summary: {
      totalRequests,
      approvedRequests,
      pendingRequests,
      rejectedRequests,
      approvalRate,
    },
    byLeaveType,
    utilization,
    trends,
  };
}

/**
 * Performance analytics interface
 */
export interface PerformanceAnalytics {
  summary: {
    totalReviews: number;
    completedReviews: number;
    averageRating: number;
    completionRate: number;
  };
  ratingDistribution: Array<{
    rating: string;
    count: number;
    percentage: number;
  }>;
  byDepartment: Array<{
    department: string;
    averageRating: number;
    completedReviews: number;
    totalReviews: number;
  }>;
  goalProgress: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    overdueGoals: number;
    completionRate: number;
  };
}

/**
 * Get performance analytics
 */
export async function getPerformanceAnalytics(tenantId: string, cycleId?: string): Promise<PerformanceAnalytics> {
  const whereClause: any = { tenantId };
  if (cycleId) {
    whereClause.reviewCycleId = cycleId;
  }

  // Summary
  const totalReviews = await prisma.performanceReview.count({
    where: whereClause,
  });

  const completedReviews = await prisma.performanceReview.count({
    where: { ...whereClause, status: 'COMPLETED' },
  });

  const averageRatingResult = await prisma.performanceReview.aggregate({
    where: { ...whereClause, overallRating: { not: null } },
    _avg: { overallRating: true },
  });

  const completionRate = totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0;

  // Rating distribution
  const reviews = await prisma.performanceReview.findMany({
    where: { ...whereClause, overallRating: { not: null } },
    select: { overallRating: true },
  });

  const ratingGroups = reviews.reduce((acc: any, review: any) => {
    const rating = Math.floor(review.overallRating || 0);
    const key = `${rating}-${rating + 1}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const ratingDistribution = Object.entries(ratingGroups).map(([rating, count]: [string, any]) => ({
    rating,
    count,
    percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
  }));

  // By department
  const reviewsByDept = await prisma.performanceReview.groupBy({
    by: ['employeeId'],
    where: whereClause,
    _avg: { overallRating: true },
    _count: { id: true },
  });

  const byDepartment = await Promise.all(
    reviewsByDept.map(async (item: any) => {
      const employee = await prisma.employee.findUnique({
        where: { id: item.employeeId },
        include: { department: { select: { name: true } } },
      });
      return {
        department: employee?.department.name || 'Unknown',
        averageRating: item._avg.overallRating || 0,
        reviewCount: item._count.id,
      };
    })
  );

  const deptGroups = byDepartment.reduce((acc: any, item) => {
    const dept = item.department;
    if (!acc[dept]) {
      acc[dept] = { totalRating: 0, totalReviews: 0, completedReviews: 0 };
    }
    acc[dept].totalRating += item.averageRating * item.reviewCount;
    acc[dept].totalReviews += item.reviewCount;
    return acc;
  }, {});

  const departmentAnalytics = Object.entries(deptGroups).map(([dept, data]: [string, any]) => ({
    department: dept,
    averageRating: data.totalReviews > 0 ? data.totalRating / data.totalReviews : 0,
    completedReviews: data.completedReviews,
    totalReviews: data.totalReviews,
  }));

  // Goal progress
  const totalGoals = await prisma.performanceGoal.count({
    where: { tenantId },
  });

  const completedGoals = await prisma.performanceGoal.count({
    where: { tenantId, status: 'COMPLETED' },
  });

  const inProgressGoals = await prisma.performanceGoal.count({
    where: { tenantId, status: 'ACTIVE' },
  });

  const overdueGoals = await prisma.performanceGoal.count({
    where: {
      tenantId,
      status: 'ACTIVE',
      targetDate: { lt: new Date() },
    },
  });

  const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return {
    summary: {
      totalReviews,
      completedReviews,
      averageRating: averageRatingResult._avg.overallRating || 0,
      completionRate,
    },
    ratingDistribution,
    byDepartment: departmentAnalytics,
    goalProgress: {
      totalGoals,
      completedGoals,
      inProgressGoals,
      overdueGoals,
      completionRate: goalCompletionRate,
    },
  };
}

/**
 * Get overtime analytics (total, average) using PayrollItem with category 'OVERTIME'
 */
export async function getOvertimeAnalytics(tenantId: string) {
  // Aggregate overtime payroll items
  const overtimeItems = await prisma.payrollItem.findMany({
    where: { tenantId, category: 'OVERTIME' },
    select: { amount: true },
  });
  const totalOvertime = overtimeItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const averageOvertime = overtimeItems.length > 0 ? totalOvertime / overtimeItems.length : 0;
  return { totalOvertime, averageOvertime };
}

/**
 * Diversity and attendance analytics are not supported due to missing fields/tables in the schema.
 */
export async function getDiversityAnalytics() {
  return { message: 'Diversity analytics not available: employee.gender and employee.dateOfBirth fields are missing.' };
}
export async function getAttendanceTrends() {
  return { message: 'Attendance analytics not available: attendance table is missing.' };
}

/**
 * Generate custom analytics based on query
 */
export async function generateCustomAnalytics(
  tenantId: string,
  query: string,
  parameters: any = {}
): Promise<AnalyticsData> {
  try {
    // This is a simplified implementation
    // In a production system, you would want to:
    // 1. Validate and sanitize the query
    // 2. Use a query builder or ORM
    // 3. Implement proper security measures
    
    const result = await prisma.$queryRawUnsafe(query, ...Object.values(parameters));
    return result as AnalyticsData;
  } catch (error) {
    console.error('Custom analytics query error:', error);
    throw new Error('Failed to execute custom analytics query');
  }
}

/**
 * Get real-time metrics for dashboard
 */
export async function getRealTimeMetrics(tenantId: string) {
  return await getDashboardMetrics(tenantId);
}

/**
 * Get audit trail (recent HR activities)
 */
export async function getAuditTrail({ tenantId, limit = 10 }: { tenantId: string, limit?: number }) {
  // Fetch recent audit trail entries for the tenant
  const data = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  
  // Format the data to match frontend expectations
  const formattedData = data.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User',
    action: log.action,
    module: log.entity,
    details: log.details,
    timestamp: log.createdAt,
  }));

  return { data: formattedData };
}

/**
 * Get salary advance analytics
 */
export async function getSalaryAdvanceAnalytics(tenantId: string): Promise<{
  requestTrends: any;
  approvalRates: any;
  repaymentPerformance: any;
  riskAnalysis: any;
  departmentUtilization: any;
  amountDistribution: any;
}> {
  try {
    const currentDate = new Date();
    // Removed unused variable: oneYearAgo

    // Request trends (last 12 months)
    const requestTrends = {
      labels: [] as string[],
      datasets: [{
        label: 'Requests',
        data: [] as number[],
      }, {
        label: 'Amount',
        data: [] as number[],
      }]
    };

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

      const monthRequests = await prisma.salaryAdvanceRequest.count({
        where: {
          tenantId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      const monthAmount = await prisma.salaryAdvanceRequest.aggregate({
        where: {
          tenantId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { requestedAmount: true },
      });

      requestTrends.labels.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      requestTrends.datasets[0].data.push(monthRequests);
      requestTrends.datasets[1].data.push(monthAmount._sum.requestedAmount || 0);
    }

    // Approval rates
    // Removed unused variable: totalRequests

    const approvedRequests = await prisma.salaryAdvanceRequest.count({
      where: { tenantId, status: 'APPROVED' },
    });

    const approvalRates = {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [{
        data: [
          approvedRequests,
          await prisma.salaryAdvanceRequest.count({ where: { tenantId, status: 'PENDING' } }),
          await prisma.salaryAdvanceRequest.count({ where: { tenantId, status: 'REJECTED' } }),
        ]
      }]
    };

    // Repayment performance - TODO: implement when repayment tracking is available
    const repaymentPerformance = {
      labels: requestTrends.labels,
      datasets: [{
        label: 'On Time',
        data: requestTrends.datasets[0].data.map(() => 0), // TODO: Calculate from real repayment data
      }]
    };

    // Risk analysis - TODO: implement when risk scoring is available
    const riskAnalysis = {
      riskDistribution: [
        { risk: 'Low', count: 0 }, // TODO: Calculate from real risk data
        { risk: 'Medium', count: 0 }, // TODO: Calculate from real risk data
        { risk: 'High', count: 0 }, // TODO: Calculate from real risk data
      ],
      defaultPrediction: requestTrends.labels.map(month => ({
        month,
        predictedDefaults: 0, // TODO: Implement predictive analytics
      })),
    };

    // Department utilization - TODO: implement when department tracking is available
    const departmentUtilization: Array<{ department: string; utilization: number }> = []; // TODO: Calculate from real data

    // Amount distribution - TODO: implement when amount analytics are needed
    const amountDistribution: Array<{ range: string; count: number }> = []; // TODO: Calculate from real data

    return {
      requestTrends,
      approvalRates,
      repaymentPerformance,
      riskAnalysis,
      departmentUtilization,
      amountDistribution,
    };
  } catch (error) {
    console.error('Get salary advance analytics error:', error);
    throw error;
  }
}

/**
 * Get training analytics
 */
export async function getTrainingAnalytics(tenantId: string): Promise<{
  upcomingTrainings: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    instructor: string;
    duration: number;
    capacity: number;
    enrolled: number;
    startDate: string;
    endDate: string;
    status: string;
    cost: number;
    venue?: string;
    requirements?: string[];
    certification?: boolean;
  }>;
  enrollmentStats: {
    totalEnrollments: number;
    completedTrainings: number;
    inProgressTrainings: number;
    certificatesIssued: number;
  };
}> {
  const [trainings, enrollmentStats] = await Promise.all([
    // Get all trainings with enrollment counts
    prisma.training.findMany({
      where: { tenantId },
      include: {
        enrollments: {
          select: {
            id: true,
            status: true,
            certificateIssued: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    }),
    
    // Get enrollment statistics
    prisma.trainingEnrollment.aggregate({
      where: {
        training: { tenantId }
      },
      _count: {
        id: true
      }
    })
  ]);

  const [completedCount, inProgressCount, certificatesCount] = await Promise.all([
    prisma.trainingEnrollment.count({
      where: {
        training: { tenantId },
        status: 'completed'
      }
    }),
    prisma.trainingEnrollment.count({
      where: {
        training: { tenantId },
        status: 'in_progress'
      }
    }),
    prisma.trainingEnrollment.count({
      where: {
        training: { tenantId },
        certificateIssued: true
      }
    })
  ]);

  const formattedTrainings = trainings.map(training => ({
    id: training.id,
    title: training.title,
    description: training.description || '',
    category: training.category || 'General',
    instructor: training.instructor || 'TBD',
    duration: 8, // Default duration in hours - you might want to add this field to schema
    capacity: training.capacity || 0,
    enrolled: training.enrollments.length,
    startDate: training.startDate.toISOString(),
    endDate: training.endDate.toISOString(),
    status: training.status,
    cost: Number(training.cost) || 0,
    venue: training.venue || undefined,
    requirements: training.requirements,
    certification: training.certification
  }));

  return {
    upcomingTrainings: formattedTrainings,
    enrollmentStats: {
      totalEnrollments: enrollmentStats._count.id || 0,
      completedTrainings: completedCount,
      inProgressTrainings: inProgressCount,
      certificatesIssued: certificatesCount
    }
  };
}

// EmployeeAnalytics interface (already present)
// PayrollAnalytics interface (already present)
// LeaveAnalytics interface (already present)
// PerformanceAnalytics interface (already present)
// All interfaces are now defined and exported before their usage.
