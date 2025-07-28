import prisma from '../lib/prisma';

export interface LeaveBalanceCalculation {
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carriedForward: number;
  accrued: number;
}

/**
 * Calculate working days between two dates (excluding weekends and holidays)
 */
export async function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  tenantId: string
): Promise<number> {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  // Get holidays for the date range
  const holidays = await prisma.holiday.findMany({
    where: {
      tenantId,
      isActive: true,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  const holidayDates = new Set(
    holidays.map((holiday: any) => holiday.date.toDateString())
  );
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    const isHoliday = holidayDates.has(currentDate.toDateString());
    
    if (!isWeekend && !isHoliday) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * Calculate leave balance for an employee and leave type
 */
export async function calculateLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  year: number,
  tenantId: string
): Promise<LeaveBalanceCalculation> {
  // Get leave policy for this leave type
  const policy = await prisma.leavePolicy.findFirst({
    where: {
      leaveTypeId,
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
    throw new Error('No active leave policy found for this leave type');
  }

  // Get employee details
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Calculate allocated days based on policy
  let allocated = policy.maxDaysPerYear;
  
  // If employee joined during the year, prorate the allocation
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const hireDate = employee.hireDate;
  
  if (hireDate > yearStart) {
    const monthsWorked = 12 - hireDate.getMonth();
    allocated = Math.floor((policy.maxDaysPerYear / 12) * monthsWorked);
  }

  // Calculate accrued days if accrual rate is set
  let accrued = 0;
  if (policy.accrualRate > 0) {
    const currentDate = new Date();
    const startOfYear = new Date(year, 0, 1);
    const endDate = currentDate < yearEnd ? currentDate : yearEnd;
    
    if (endDate > startOfYear) {
      const monthsElapsed = (endDate.getFullYear() - startOfYear.getFullYear()) * 12 + 
                           (endDate.getMonth() - startOfYear.getMonth());
      accrued = Math.floor(policy.accrualRate * monthsElapsed);
    }
  }

  // Get used days from approved leave requests
  const approvedRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      leaveTypeId,
      tenantId,
      status: 'APPROVED',
      startDate: { gte: yearStart },
      endDate: { lte: yearEnd },
    },
  });

  const used = approvedRequests.reduce((total: number, request: any) => total + request.totalDays, 0);

  // Get pending days from pending leave requests
  const pendingRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      leaveTypeId,
      tenantId,
      status: 'PENDING',
      startDate: { gte: yearStart },
      endDate: { lte: yearEnd },
    },
  });

  const pending = pendingRequests.reduce((total: number, request: any) => total + request.totalDays, 0);

  // Get carried forward from previous year
  let carriedForward = 0;
  if (policy.maxCarryForward > 0 && year > new Date(employee.hireDate).getFullYear()) {
    const previousYearBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year: year - 1,
        tenantId,
      },
    });

    if (previousYearBalance) {
      const previousAvailable = previousYearBalance.available;
      carriedForward = Math.min(previousAvailable, policy.maxCarryForward);
    }
  }

  // Calculate available days
  const totalAllocated = allocated + carriedForward + accrued;
  const available = totalAllocated - used - pending;

  return {
    allocated: totalAllocated,
    used,
    pending,
    available,
    carriedForward,
    accrued,
  };
}

/**
 * Update or create leave balance record
 */
export async function updateLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  year: number,
  tenantId: string
): Promise<void> {
  const calculation = await calculateLeaveBalance(employeeId, leaveTypeId, year, tenantId);

  await prisma.leaveBalance.upsert({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year,
      },
    },
    update: {
      allocated: calculation.allocated,
      used: calculation.used,
      pending: calculation.pending,
      available: calculation.available,
      carriedForward: calculation.carriedForward,
      accrued: calculation.accrued,
      lastUpdated: new Date(),
    },
    create: {
      employeeId,
      leaveTypeId,
      year,
      allocated: calculation.allocated,
      used: calculation.used,
      pending: calculation.pending,
      available: calculation.available,
      carriedForward: calculation.carriedForward,
      accrued: calculation.accrued,
      tenantId,
    },
  });
}

/**
 * Validate leave request
 */
export async function validateLeaveRequest(
  employeeId: string,
  leaveTypeId: string,
  startDate: Date,
  endDate: Date,
  tenantId: string
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Get leave policy
  const policy = await prisma.leavePolicy.findFirst({
    where: {
      leaveTypeId,
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
    errors.push('No active leave policy found for this leave type');
    return { isValid: false, errors };
  }

  // Get employee
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
  });

  if (!employee) {
    errors.push('Employee not found');
    return { isValid: false, errors };
  }

  // Check if employee is still in probation period
  if (policy.probationPeriodDays > 0) {
    const daysSinceHire = Math.floor(
      (new Date().getTime() - employee.hireDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceHire < policy.probationPeriodDays) {
      errors.push(`Cannot apply for leave during probation period (${policy.probationPeriodDays} days)`);
    }
  }

  // Check minimum notice period
  if (policy.minDaysNotice > 0) {
    const daysNotice = Math.floor(
      (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysNotice < policy.minDaysNotice) {
      errors.push(`Minimum ${policy.minDaysNotice} days notice required`);
    }
  }

  // Calculate working days for the request
  const workingDays = await calculateWorkingDays(startDate, endDate, tenantId);

  // Check maximum days per request
  if (policy.maxDaysPerRequest && workingDays > policy.maxDaysPerRequest) {
    errors.push(`Maximum ${policy.maxDaysPerRequest} days allowed per request`);
  }

  // Check available balance
  const year = startDate.getFullYear();
  const balance = await calculateLeaveBalance(employeeId, leaveTypeId, year, tenantId);
  
  if (!policy.allowNegativeBalance && workingDays > balance.available) {
    errors.push(`Insufficient leave balance. Available: ${balance.available} days, Requested: ${workingDays} days`);
  }

  // Check for overlapping requests
  const overlappingRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      tenantId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  if (overlappingRequests.length > 0) {
    errors.push('Leave request overlaps with existing request');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Initialize leave balances for a new employee
 */
export async function initializeEmployeeLeaveBalances(
  employeeId: string,
  tenantId: string
): Promise<void> {
  const currentYear = new Date().getFullYear();
  
  // Get all active leave types
  const leaveTypes = await prisma.leaveType.findMany({
    where: { tenantId, isActive: true },
  });

  // Create leave balances for each leave type
  for (const leaveType of leaveTypes) {
    try {
      await updateLeaveBalance(employeeId, leaveType.id, currentYear, tenantId);
    } catch (error) {
      console.error(`Error initializing leave balance for employee ${employeeId}, leave type ${leaveType.id}:`, error);
    }
  }
}

/**
 * Process leave request approval/rejection
 */
export async function processLeaveRequestDecision(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  decidedBy: string,
  reason?: string,
  tenantId?: string
): Promise<void> {
  const request = await prisma.leaveRequest.findFirst({
    where: { 
      id: requestId,
      ...(tenantId && { tenantId }),
    },
  });

  if (!request) {
    throw new Error('Leave request not found');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Leave request is not in pending status');
  }

  const updateData: any = {
    status: decision,
    updatedAt: new Date(),
  };

  if (decision === 'APPROVED') {
    updateData.approvedAt = new Date();
    updateData.approvedBy = decidedBy;
  } else {
    updateData.rejectedAt = new Date();
    updateData.rejectedBy = decidedBy;
    updateData.rejectionReason = reason;
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: updateData,
  });

  // Update leave balance
  const year = request.startDate.getFullYear();
  await updateLeaveBalance(request.employeeId, request.leaveTypeId, year, request.tenantId);
}
