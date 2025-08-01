import prisma from '../lib/prisma';

export interface SalaryAdvanceEligibility {
  isEligible: boolean;
  reason?: string;
  maxAmount?: number;
  serviceMonths?: number;
  existingAdvances?: number;
  maxAdvancesPerYear?: number;
}

export interface SalaryAdvanceCalculation {
  requestedAmount: number;
  maxAllowedAmount: number;
  monthlyDeduction: number;
  interestRate: number;
  totalInterest: number;
  totalRepayment: number;
  repaymentStartDate: Date;
  estimatedRepaymentMonths: number;
}

/**
 * Check if an employee is eligible for a salary advance
 */
export async function checkSalaryAdvanceEligibility(
  employeeId: string,
  tenantId: string,
  requestedAmount: number
): Promise<SalaryAdvanceEligibility> {
  // Debug logging
  console.log('[checkSalaryAdvanceEligibility] employeeId:', employeeId, 'tenantId:', tenantId);
  // Check if employeeId is UUID or employeeNumber
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
  console.log('[checkSalaryAdvanceEligibility] isUuid:', isUuid);
  // Try to find employee by id first, then by employeeNumber
  let employee = null;
  if (isUuid) {
    employee = await prisma.employee.findUnique({
      where: { id: employeeId, tenantId },
      select: {
        id: true,
        employeeNumber: true,
        salary: true,
        hireDate: true,
        status: true,
      },
    });
  } else {
    employee = await prisma.employee.findFirst({
      where: { employeeNumber: employeeId, tenantId },
      select: {
        id: true,
        employeeNumber: true,
        salary: true,
        hireDate: true,
        status: true,
      },
    });
  }
  console.log('[checkSalaryAdvanceEligibility] employee lookup result:', employee);
  if (!employee) {
    return {
      isEligible: false,
      reason: 'Employee not found',
    };
  }

  if (employee.status !== 'ACTIVE') {
    return {
      isEligible: false,
      reason: 'Employee is not active',
    };
  }

  if (!employee.salary) {
    return {
      isEligible: false,
      reason: 'Employee salary not defined',
    };
  }

  // Get active salary advance policy
  const policy = await prisma.salaryAdvancePolicy.findFirst({
    where: {
      tenantId,
      isActive: true,
      effectiveDate: { lte: new Date() },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ],
    },
    orderBy: { effectiveDate: 'desc' },
  });

  if (!policy) {
    return {
      isEligible: false,
      reason: 'No active salary advance policy found',
    };
  }

  // Check service period
  const serviceMonths = Math.floor(
    (new Date().getTime() - employee.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (serviceMonths < policy.minServiceMonths) {
    return {
      isEligible: false,
      reason: `Minimum service period of ${policy.minServiceMonths} months required`,
      serviceMonths,
    };
  }

  // Check existing advances this month (instead of year)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);

  const existingAdvancesThisMonth = await prisma.salaryAdvanceRequest.aggregate({
    where: {
      employeeId,
      tenantId,
      status: { in: ['APPROVED', 'DISBURSED', 'PENDING'] },
      requestDate: { gte: monthStart, lte: monthEnd },
    },
    _sum: {
      requestedAmount: true,
    },
  });

  const totalRequestedThisMonth = existingAdvancesThisMonth._sum.requestedAmount || 0;

  // Calculate maximum allowed amount (25% of basic salary)
  const maxPercentageAmount = (employee.salary * policy.maxAdvancePercentage) / 100;
  const maxAmount = policy.maxAdvanceAmount
    ? Math.min(maxPercentageAmount, policy.maxAdvanceAmount)
    : maxPercentageAmount;

  // Check if requested amount would exceed monthly limit
  const availableAmount = maxAmount - totalRequestedThisMonth;
  if (requestedAmount > availableAmount) {
    return {
      isEligible: false,
      reason: `Requested amount would exceed monthly limit. Available: ${availableAmount.toFixed(2)} (${policy.maxAdvancePercentage}% of salary: ${maxAmount.toFixed(2)}, already requested this month: ${totalRequestedThisMonth.toFixed(2)})`,
      maxAmount,
    };
  }

  return {
    isEligible: true,
    maxAmount,
    serviceMonths,
    existingAdvances: totalRequestedThisMonth,
    maxAdvancesPerYear: policy.maxAdvancesPerYear,
  };
}

/**
 * Calculate salary advance repayment details
 */
export async function calculateSalaryAdvanceRepayment(
  employeeId: string,
  tenantId: string,
  requestedAmount: number
): Promise<SalaryAdvanceCalculation | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, tenantId },
    select: { salary: true },
  });

  if (!employee?.salary) {
    return null;
  }

  const policy = await prisma.salaryAdvancePolicy.findFirst({
    where: {
      tenantId,
      isActive: true,
      effectiveDate: { lte: new Date() },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ],
    },
    orderBy: { effectiveDate: 'desc' },
  });

  if (!policy) {
    return null;
  }

  const maxPercentageAmount = (employee.salary * policy.maxAdvancePercentage) / 100;
  const maxAllowedAmount = policy.maxAdvanceAmount
    ? Math.min(maxPercentageAmount, policy.maxAdvanceAmount)
    : maxPercentageAmount;

  const interestRate = policy.interestRate;
  
  // Calculate monthly deduction based on policy percentage
  const monthlyDeduction = (requestedAmount * policy.monthlyDeductionPercentage) / 100;
  
  // Calculate interest (simple interest for estimated duration)
  const estimatedRepaymentMonths = Math.ceil(requestedAmount / monthlyDeduction);
  const totalInterest = (requestedAmount * interestRate * estimatedRepaymentMonths) / (100 * 12);
  const totalRepayment = requestedAmount + totalInterest;

  // Calculate repayment start date (next month)
  const repaymentStartDate = new Date();
  repaymentStartDate.setMonth(repaymentStartDate.getMonth() + 1);

  return {
    requestedAmount,
    maxAllowedAmount,
    monthlyDeduction,
    interestRate,
    totalInterest,
    totalRepayment,
    repaymentStartDate,
    estimatedRepaymentMonths,
  };
}

/**
 * Create a salary advance request
 */
export async function createSalaryAdvanceRequest(
  employeeId: string,
  tenantId: string,
  requestData: {
    requestedAmount: number;
    reason: string;
    attachments?: string[];
  }
): Promise<any> {
  const { requestedAmount, reason, attachments = [] } = requestData;

  // Check eligibility
  const eligibility = await checkSalaryAdvanceEligibility(employeeId, tenantId, requestedAmount);
  if (!eligibility.isEligible) {
    throw new Error(eligibility.reason || 'Employee not eligible for salary advance');
  }

  // Calculate repayment details
  const calculation = await calculateSalaryAdvanceRepayment(employeeId, tenantId, requestedAmount);
  if (!calculation) {
    throw new Error('Unable to calculate repayment details');
  }

  // Get policy for auto-approval check
  const policy = await prisma.salaryAdvancePolicy.findFirst({
    where: {
      tenantId,
      isActive: true,
      effectiveDate: { lte: new Date() },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ],
    },
    orderBy: { effectiveDate: 'desc' },
  });

  let status: string;
  if (policy?.autoApprove) {
    status = 'APPROVED';
  } else {
    // Fetch employee record with branch and position
    const employeeRecord = await prisma.employee.findUnique({
      where: { id: employeeId, tenantId },
      select: { branchId: true, position: true },
    });
    if (employeeRecord?.position === 'OPERATIONS_MANAGER') {
      // If the requester is an operations manager, always forward to HR
      status = 'FORWARDEDTOHR';
    } else if (!employeeRecord?.branchId || employeeRecord?.position === 'BRANCH_MANAGER') {
      status = 'PENDINGHRREVIEW';
    } else {
      status = 'PENDINGOPREVIEW';
    }
  }
  const approvedAmount = policy?.autoApprove ? requestedAmount : null;
  const approvedAt = policy?.autoApprove ? new Date() : null;

  // Create the request
  // Determine if this is a self-request by an operations manager
  // Fetch employee record with branch and position (for both approval logic and branchId)
  const employeeRecord = await prisma.employee.findUnique({
    where: { id: employeeId, tenantId },
    select: { branchId: true, position: true },
  });
  let opsManagerId: string | null = null;
  if (employeeRecord && employeeRecord.position === 'OPERATIONS_MANAGER') {
    opsManagerId = employeeId;
  }
  const branchId = employeeRecord?.branchId || null;
  const salaryAdvanceRequest = await prisma.salaryAdvanceRequest.create({
    data: {
      employeeId,
      tenantId,
      branchId,
      requestedAmount,
      approvedAmount,
      reason,
      status,
      approvedAt,
      repaymentStartDate: calculation.repaymentStartDate,
      monthlyDeduction: calculation.monthlyDeduction,
      outstandingBalance: approvedAmount || requestedAmount,
      interestRate: calculation.interestRate,
      totalInterest: calculation.totalInterest,
      attachments,
      ...(opsManagerId ? { opsManagerId } : {}),
    },
    include: {
      employee: {
        select: {
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          salary: true,
        },
      },
    },
  });

  return salaryAdvanceRequest;
}

/**
 * Approve or reject a salary advance request
 */
export async function processSalaryAdvanceRequest(
  requestId: string,
  tenantId: string,
  decision: 'APPROVED' | 'REJECTED' | 'FORWARDEDTOHR',
  processedBy: string,
  data: {
    approvedAmount?: number;
    rejectionReason?: string;
    comments?: string;
  }
): Promise<any> {
  const request = await prisma.salaryAdvanceRequest.findUnique({
    where: { id: requestId, tenantId },
    include: { employee: true },
  });

  if (!request) {
    throw new Error('Salary advance request not found');
  }

  // Allow transition from PENDINGOPREVIEW to FORWARDEDTOHR, and from FORWARDEDTOHR to APPROVED/REJECTED
  if (
    (request.status === 'PENDINGOPREVIEW' && decision === 'FORWARDEDTOHR') ||
    (request.status === 'FORWARDEDTOHR' && (decision === 'APPROVED' || decision === 'REJECTED'))
  ) {
    if (decision === 'FORWARDEDTOHR') {
      // Ops manager forwards to HR
      return await prisma.salaryAdvanceRequest.update({
        where: { id: requestId },
        data: {
          status: 'FORWARDEDTOHR',
          comments: data.comments,
        },
        include: {
          employee: {
            select: {
              employeeNumber: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } else if (decision === 'APPROVED') {
      const approvedAmount = data.approvedAmount || request.requestedAmount;
      // Recalculate repayment if approved amount is different
      let calculation = null;
      if (approvedAmount !== request.requestedAmount) {
        calculation = await calculateSalaryAdvanceRepayment(
          request.employeeId,
          tenantId,
          approvedAmount
        );
      }
      const updateData: any = {
        status: 'APPROVED',
        approvedAmount,
        approvedAt: new Date(),
        approvedBy: processedBy,
        outstandingBalance: approvedAmount,
        comments: data.comments,
      };
      if (calculation) {
        updateData.monthlyDeduction = calculation.monthlyDeduction;
        updateData.repaymentStartDate = calculation.repaymentStartDate;
        updateData.totalInterest = calculation.totalInterest;
      }
      return await prisma.salaryAdvanceRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          employee: {
            select: {
              employeeNumber: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } else if (decision === 'REJECTED') {
      return await prisma.salaryAdvanceRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: processedBy,
          rejectionReason: data.rejectionReason,
          comments: data.comments,
        },
        include: {
          employee: {
            select: {
              employeeNumber: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }
  } else {
    throw new Error('Invalid status transition or request has already been processed');
  }
}

/**
 * Disburse an approved salary advance
 */
export async function disburseSalaryAdvance(
  requestId: string,
  tenantId: string,
  disbursedBy: string,
  disbursementData: {
    disbursementMethod?: string;
    reference?: string;
    comments?: string;
  }
): Promise<any> {
  const request = await prisma.salaryAdvanceRequest.findUnique({
    where: { id: requestId, tenantId },
  });

  if (!request) {
    throw new Error('Salary advance request not found');
  }

  if (request.status !== 'APPROVED') {
    throw new Error('Request must be approved before disbursement');
  }

  return await prisma.salaryAdvanceRequest.update({
    where: { id: requestId },
    data: {
      status: 'DISBURSED',
      disbursedAt: new Date(),
      disbursedBy,
      comments: disbursementData.comments,
    },
    include: {
      employee: {
        select: {
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Process salary advance repayment
 */
export async function processSalaryAdvanceRepayment(
  requestId: string,
  tenantId: string,
  repaymentData: {
    principalAmount: number;
    interestAmount?: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    payrollPeriodId?: string;
  }
): Promise<any> {
  const request = await prisma.salaryAdvanceRequest.findUnique({
    where: { id: requestId, tenantId },
  });

  if (!request) {
    throw new Error('Salary advance request not found');
  }

  if (request.status !== 'DISBURSED') {
    throw new Error('Advance must be disbursed before repayment');
  }

  const interestAmount = repaymentData.interestAmount || 0;
  const totalAmount = repaymentData.principalAmount + interestAmount;

  // Create repayment record
  const repayment = await prisma.salaryAdvanceRepayment.create({
    data: {
      salaryAdvanceRequestId: requestId,
      tenantId,
      repaymentDate: new Date(),
      principalAmount: repaymentData.principalAmount,
      interestAmount,
      totalAmount,
      paymentMethod: repaymentData.paymentMethod || 'SALARY_DEDUCTION',
      reference: repaymentData.reference,
      notes: repaymentData.notes,
      payrollPeriodId: repaymentData.payrollPeriodId,
    },
  });

  // Update request totals
  const newTotalRepaid = request.totalRepaid + repaymentData.principalAmount;
  const newOutstandingBalance = (request.approvedAmount || request.requestedAmount) - newTotalRepaid;
  const status = newOutstandingBalance <= 0 ? 'REPAID' : 'DISBURSED';

  await prisma.salaryAdvanceRequest.update({
    where: { id: requestId },
    data: {
      totalRepaid: newTotalRepaid,
      outstandingBalance: Math.max(0, newOutstandingBalance),
      status,
    },
  });

  return repayment;
}

/**
 * Get salary advance requests with filters
 */
export async function getSalaryAdvanceRequests(
  tenantId: string,
  filters: {
    employeeId?: string;
    status?: string;
    department?: string;
    branchId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    userRole?: string;
    userId?: string;
  } = {}
): Promise<any> {
  const where: any = { tenantId };

  if (filters.employeeId) {
    // Support both UUID and employeeNumber (string or number)
    where.OR = [
      { employeeId: filters.employeeId },
      { employee: { employeeNumber: filters.employeeId } },
    ];
  }

  // Filter by branch for operations managers
  if (filters.userRole === 'OPS_MANAGER' && filters.userId) {
    // Get user's employee record to find their branch
    const userEmployee = await prisma.employee.findFirst({
      where: { 
        user: { id: filters.userId },
        tenantId 
      }
    });
    
    if (userEmployee?.branchId) {
      where.employee = where.employee || {};
      where.employee.branchId = userEmployee.branchId;
    }
  } else if (filters.branchId) {
    // Only include requests for employees in the specified branch
    where.employee = where.employee || {};
    where.employee.branchId = filters.branchId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.requestDate = {};
    if (filters.startDate) {
      where.requestDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.requestDate.lte = filters.endDate;
    }
  }

  const [requests, total] = await Promise.all([
    prisma.salaryAdvanceRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: { select: { name: true } },
            branch: { select: { name: true, managerId: true } },
          },
        },
        repayments: {
          orderBy: { repaymentDate: 'desc' },
        },
      },
      orderBy: { requestDate: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.salaryAdvanceRequest.count({ where }),
  ]);

  // Enrich each request with managerId (employeeId of ops manager) and managerUserId (userId mapped from employeeId)
  const enrichedRequests = await Promise.all(requests.map(async (req: any) => {
    // managerId is always the branch.managerId (employeeId of ops manager)
    const managerId = req.employee?.branch?.managerId || '';
    let managerUserId = '';
    if (managerId) {
      // Look up the userId for the managerId (employeeId)
      const managerUser = await prisma.user.findFirst({
        where: { employeeId: managerId },
        select: { id: true },
      });
      managerUserId = managerUser?.id || '';
    }
    return {
      ...req,
      managerId,
      managerUserId,
    };
  }));
  console.log('[DEBUG][getSalaryAdvanceRequests] enrichedRequests:', JSON.stringify(enrichedRequests, null, 2));
  return { requests: enrichedRequests, total };
}

/**
 * Get salary advance analytics
 */
export async function getSalaryAdvanceAnalytics(
  tenantId: string,
  year?: number
): Promise<any> {
  const targetYear = year || new Date().getFullYear();
  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear, 11, 31);

  const [
    totalRequests,
    approvedRequests,
    disbursedRequests,
    totalDisbursed,
    totalRepaid,
    outstandingAmount,
  ] = await Promise.all([
    prisma.salaryAdvanceRequest.count({
      where: { tenantId, requestDate: { gte: yearStart, lte: yearEnd } },
    }),
    prisma.salaryAdvanceRequest.count({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'DISBURSED', 'REPAID'] },
        requestDate: { gte: yearStart, lte: yearEnd },
      },
    }),
    prisma.salaryAdvanceRequest.count({
      where: {
        tenantId,
        status: { in: ['DISBURSED', 'REPAID'] },
        requestDate: { gte: yearStart, lte: yearEnd },
      },
    }),
    prisma.salaryAdvanceRequest.aggregate({
      where: {
        tenantId,
        status: { in: ['DISBURSED', 'REPAID'] },
        requestDate: { gte: yearStart, lte: yearEnd },
      },
      _sum: { approvedAmount: true },
    }),
    prisma.salaryAdvanceRequest.aggregate({
      where: {
        tenantId,
        requestDate: { gte: yearStart, lte: yearEnd },
      },
      _sum: { totalRepaid: true },
    }),
    prisma.salaryAdvanceRequest.aggregate({
      where: {
        tenantId,
        status: 'DISBURSED',
      },
      _sum: { outstandingBalance: true },
    }),
  ]);

  const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
  const disbursementRate = approvedRequests > 0 ? (disbursedRequests / approvedRequests) * 100 : 0;

  return {
    summary: {
      totalRequests,
      approvedRequests,
      disbursedRequests,
      approvalRate,
      disbursementRate,
      totalDisbursed: totalDisbursed._sum.approvedAmount || 0,
      totalRepaid: totalRepaid._sum.totalRepaid || 0,
      outstandingAmount: outstandingAmount._sum.outstandingBalance || 0,
    },
    year: targetYear,
  };
}
