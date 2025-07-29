import { processSalaryAdvanceRequest } from '../services/salaryAdvance.service';
/**
 * Update salary advance request (approve/reject/status update)
 * @route PATCH /api/salary-advances/:id
 */
export const updateSalaryAdvanceRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user;
    const requestId = req.params.id;
    if (!tenantId || !user?.userId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID and userId are required' });
    }
    const { status, approverId, approvedAmount, rejectionReason, comments } = req.body;
    if (!status || !['APPROVED', 'REJECTED', 'FORWARDEDTOHR'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Status must be APPROVED, REJECTED, or FORWARDEDTOHR' });
    }
    const decision = status;
    const processedBy = approverId || user.userId;
    const data: any = { approvedAmount, rejectionReason, comments };
    const updated = await processSalaryAdvanceRequest(requestId, tenantId, decision, processedBy, data);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (error: any) {
    console.error('Update salary advance request error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to update salary advance request' });
  }
};
import { createSalaryAdvanceRequest as createSalaryAdvanceRequestService } from '../services/salaryAdvance.service';
import prisma from '../lib/prisma';

/**
 * Create a new salary advance request
 * @route POST /api/salary-advances
 */
export const createSalaryAdvanceRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user;
    if (!tenantId || !user?.userId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID and userId are required' });
    }
    // Look up employeeId from User record
    const userRecord = await prisma.user.findFirst({
      where: { id: user.userId, tenantId },
      select: { employeeId: true },
    });
    if (!userRecord?.employeeId) {
      return res.status(404).json({ status: 'error', message: 'No employee record found for this user' });
    }
    const { requestedAmount, reason, attachments } = req.body;
    if (typeof requestedAmount !== 'number' || !reason) {
      return res.status(400).json({ status: 'error', message: 'requestedAmount (number) and reason (string) are required' });
    }
    const request = await createSalaryAdvanceRequestService(userRecord.employeeId, tenantId, { requestedAmount, reason, attachments });
    return res.status(201).json({ status: 'success', data: request });
  } catch (error: any) {
    console.error('Create salary advance request error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to create salary advance request' });
  }
};
import { Request, Response } from 'express';
import { getSalaryAdvanceRequests as getSalaryAdvanceRequestsService } from '../services/salaryAdvance.service';

/**
 * Get salary advance requests with optional filters
 * @route GET /api/salary-advances
 */
export const getSalaryAdvanceRequests = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    console.log('[HRMS][GET /api/salary-advances] tenantId:', tenantId);
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Collect filters from query params (exclude tenantId)
    // eslint-disable-next-line no-unused-vars
    const { tenantId: _omit, ...filters } = req.query;
    
    // Add user role and ID for branch filtering
    const enhancedFilters = {
      ...filters,
      userRole: req.user?.role,
      userId: req.user?.userId
    };
    
    console.log('[HRMS][GET /api/salary-advances] filters:', enhancedFilters);
    const data = await getSalaryAdvanceRequestsService(tenantId, enhancedFilters);
    console.log('[HRMS][GET /api/salary-advances] result count:', Array.isArray(data?.requests) ? data.requests.length : 'n/a');
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Get salary advance requests error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching salary advance requests' });
  }
};
import { 
  checkSalaryAdvanceEligibility,
  disburseSalaryAdvance as disburseSalaryAdvanceService,
  getSalaryAdvanceAnalytics
} from '../services/salaryAdvance.service';

/**
 * Get salary advance eligibility for an employee
 * @route GET /api/salary-advances/eligibility/:employeeId
 */
export const getSalaryAdvanceEligibility = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // For eligibility check, we need a requested amount - use a default or get from query
    const requestedAmount = parseFloat(req.query.amount as string) || 0;
    
    const eligibility = await checkSalaryAdvanceEligibility(employeeId, tenantId, requestedAmount);
    
    return res.status(200).json({ 
      status: 'success', 
      data: {
        isEligible: eligibility.isEligible,
        maxAmount: eligibility.maxAmount || 0,
        currentOutstanding: 0, // TODO: Calculate from existing advances
        availableAmount: eligibility.maxAmount || 0,
        reasons: eligibility.reason ? [eligibility.reason] : [],
        creditLimit: eligibility.maxAmount || 0,
        utilizationPercentage: 0 // TODO: Calculate based on existing advances
      }
    });
  } catch (error: any) {
    console.error('Get salary advance eligibility error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to check eligibility' });
  }
};

/**
 * Get salary advance request by ID
 * @route GET /api/salary-advances/:id
 */
export const getSalaryAdvanceById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const request = await prisma.salaryAdvanceRequest.findUnique({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            salary: true,
            department: { select: { name: true } },
            branch: { select: { name: true } }
          }
        },
        repayments: {
          orderBy: { repaymentDate: 'desc' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Salary advance request not found' });
    }

    return res.status(200).json({ status: 'success', data: request });
  } catch (error: any) {
    console.error('Get salary advance by ID error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get salary advance request' });
  }
};

/**
 * Update salary advance request details (for pending requests)
 * @route PUT /api/salary-advances/:id
 */
export const updateSalaryAdvance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { requestedAmount, reason, repaymentMonths } = req.body;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // Check if request exists and is pending
    const existingRequest = await prisma.salaryAdvanceRequest.findUnique({
      where: { id, tenantId }
    });

    if (!existingRequest) {
      return res.status(404).json({ status: 'error', message: 'Salary advance request not found' });
    }

    if (existingRequest.status !== 'PENDING' && existingRequest.status !== 'PENDINGOPREVIEW') {
      return res.status(400).json({ status: 'error', message: 'Can only update pending requests' });
    }

    const updatedRequest = await prisma.salaryAdvanceRequest.update({
      where: { id },
      data: {
        ...(requestedAmount && { requestedAmount }),
        ...(reason && { reason }),
        updatedAt: new Date()
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            salary: true,
            department: { select: { name: true } }
          }
        }
      }
    });

    return res.status(200).json({ status: 'success', data: updatedRequest });
  } catch (error: any) {
    console.error('Update salary advance error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to update salary advance request' });
  }
};

/**
 * Cancel salary advance request
 * @route PATCH /api/salary-advances/:id/cancel
 */
export const cancelSalaryAdvance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const request = await prisma.salaryAdvanceRequest.findUnique({
      where: { id, tenantId }
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Salary advance request not found' });
    }

    if (!['PENDING', 'PENDINGOPREVIEW', 'FORWARDEDTOHR'].includes(request.status)) {
      return res.status(400).json({ status: 'error', message: 'Can only cancel pending requests' });
    }

    const cancelledRequest = await prisma.salaryAdvanceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        }
      }
    });

    return res.status(200).json({ status: 'success', data: cancelledRequest });
  } catch (error: any) {
    console.error('Cancel salary advance error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to cancel salary advance request' });
  }
};

/**
 * Disburse approved salary advance
 * @route POST /api/salary-advances/:id/disburse
 */
export const disburseSalaryAdvance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user;
    const { id } = req.params;
    const { disbursedBy, disbursementMethod, referenceNumber, notes } = req.body;
    
    if (!tenantId || !user?.userId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID and userId are required' });
    }

    const disbursedByUser = disbursedBy || user.userId;
    
    const disbursedRequest = await disburseSalaryAdvanceService(id, tenantId, disbursedByUser, {
      disbursementMethod,
      reference: referenceNumber,
      comments: notes
    });

    return res.status(200).json({ status: 'success', data: disbursedRequest });
  } catch (error: any) {
    console.error('Disburse salary advance error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to disburse salary advance' });
  }
};

/**
 * Get repayment schedule for a salary advance
 * @route GET /api/salary-advances/:id/repayment-schedule
 */
export const getRepaymentSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const repayments = await prisma.salaryAdvanceRepayment.findMany({
      where: { 
        salaryAdvanceRequestId: id,
        tenantId 
      },
      orderBy: { repaymentDate: 'asc' }
    });

    return res.status(200).json({ status: 'success', data: repayments });
  } catch (error: any) {
    console.error('Get repayment schedule error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get repayment schedule' });
  }
};

/**
 * Update repayment schedule
 * @route PUT /api/salary-advances/:id/repayment-schedule
 */
export const updateRepaymentSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { repaymentMonths, startDate } = req.body;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // This is a simplified implementation - in a real system you'd recalculate the entire schedule
    const request = await prisma.salaryAdvanceRequest.findUnique({
      where: { id, tenantId }
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Salary advance request not found' });
    }

    // Update the request with new repayment parameters
    const updatedRequest = await prisma.salaryAdvanceRequest.update({
      where: { id },
      data: {
        ...(startDate && { repaymentStartDate: new Date(startDate) }),
        updatedAt: new Date()
      }
    });

    // Return existing repayments for now
    const repayments = await prisma.salaryAdvanceRepayment.findMany({
      where: { 
        salaryAdvanceRequestId: id,
        tenantId 
      },
      orderBy: { repaymentDate: 'asc' }
    });

    return res.status(200).json({ status: 'success', data: repayments });
  } catch (error: any) {
    console.error('Update repayment schedule error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to update repayment schedule' });
  }
};

/**
 * Get employee's salary advance history
 * @route GET /api/salary-advances/employee/:employeeId/history
 */
export const getEmployeeSalaryAdvanceHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId } = req.params;
    const { status, startDate, endDate } = req.query;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const where: any = { 
      employeeId,
      tenantId 
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.requestDate = {};
      if (startDate) {
        where.requestDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.requestDate.lte = new Date(endDate as string);
      }
    }

    const history = await prisma.salaryAdvanceRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        },
        repayments: true
      },
      orderBy: { requestDate: 'desc' }
    });

    return res.status(200).json({ status: 'success', data: history });
  } catch (error: any) {
    console.error('Get employee salary advance history error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get employee salary advance history' });
  }
};

/**
 * Get outstanding salary advances for an employee
 * @route GET /api/salary-advances/employee/:employeeId/outstanding
 */
export const getEmployeeOutstandingSalaryAdvance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const outstandingAdvances = await prisma.salaryAdvanceRequest.findMany({
      where: {
        employeeId,
        tenantId,
        status: 'DISBURSED',
        outstandingBalance: { gt: 0 }
      },
      select: {
        id: true,
        approvedAmount: true,
        outstandingBalance: true,
        repaymentStartDate: true,
        monthlyDeduction: true
      }
    });

    const totalOutstanding = outstandingAdvances.reduce((sum, advance) => sum + advance.outstandingBalance, 0);

    const advances = outstandingAdvances.map(advance => ({
      id: advance.id,
      originalAmount: advance.approvedAmount || 0,
      remainingAmount: advance.outstandingBalance,
      nextPaymentDate: advance.repaymentStartDate?.toISOString() || '',
      nextPaymentAmount: advance.monthlyDeduction
    }));

    return res.status(200).json({ 
      status: 'success', 
      data: {
        totalOutstanding,
        advances
      }
    });
  } catch (error: any) {
    console.error('Get outstanding salary advances error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get outstanding salary advances' });
  }
};

/**
 * Get salary advance statistics
 * @route GET /api/salary-advances/statistics
 */
export const getSalaryAdvanceStatistics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate, department, employeeId } = req.query;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const analytics = await getSalaryAdvanceAnalytics(tenantId);
    
    // This is a simplified implementation - you'd want to add more detailed statistics
    const statistics = {
      totalRequests: analytics.summary.totalRequests,
      approvedRequests: analytics.summary.approvedRequests,
      pendingRequests: analytics.summary.totalRequests - analytics.summary.approvedRequests,
      rejectedRequests: 0, // TODO: Calculate from database
      disbursedRequests: analytics.summary.disbursedRequests,
      totalAmountRequested: analytics.summary.totalDisbursed,
      totalAmountApproved: analytics.summary.totalDisbursed,
      totalAmountDisbursed: analytics.summary.totalDisbursed,
      totalOutstanding: analytics.summary.outstandingAmount,
      averageRequestAmount: analytics.summary.totalRequests > 0 ? analytics.summary.totalDisbursed / analytics.summary.totalRequests : 0,
      averageApprovalTime: 24, // TODO: Calculate from database
      repaymentRate: analytics.summary.totalDisbursed > 0 ? (analytics.summary.totalRepaid / analytics.summary.totalDisbursed) * 100 : 0,
      departmentBreakdown: [],
      monthlyTrend: []
    };

    return res.status(200).json({ status: 'success', data: statistics });
  } catch (error: any) {
    console.error('Get salary advance statistics error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get salary advance statistics' });
  }
};

/**
 * Get salary advance settings
 * @route GET /api/salary-advances/settings
 */
export const getSalaryAdvanceSettings = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const policy = await prisma.salaryAdvancePolicy.findFirst({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: { effectiveDate: 'desc' }
    });

    if (!policy) {
      return res.status(404).json({ status: 'error', message: 'No active salary advance policy found' });
    }

    const settings = {
      id: policy.id,
      maxPercentageOfSalary: policy.maxAdvancePercentage,
      maxRepaymentMonths: 12, // Default value
      minEmploymentMonths: policy.minServiceMonths,
      cooldownPeriodDays: 30, // Default value
      requiresApproval: !policy.autoApprove,
      autoApprovalLimit: policy.maxAdvanceAmount,
      interestRate: policy.interestRate,
      processingFee: 0, // Default value
      isActive: policy.isActive,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString()
    };

    return res.status(200).json({ status: 'success', data: settings });
  } catch (error: any) {
    console.error('Get salary advance settings error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get salary advance settings' });
  }
};

/**
 * Update salary advance settings
 * @route PUT /api/salary-advances/settings
 */
export const updateSalaryAdvanceSettings = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { 
      maxPercentageOfSalary, 
      maxRepaymentMonths, 
      minEmploymentMonths, 
      requiresApproval, 
      autoApprovalLimit, 
      interestRate,
      isActive 
    } = req.body;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // Find existing policy or create new one
    let policy = await prisma.salaryAdvancePolicy.findFirst({
      where: {
        tenantId,
        isActive: true
      }
    });

    const updateData: any = {
      ...(maxPercentageOfSalary !== undefined && { maxAdvancePercentage: maxPercentageOfSalary }),
      ...(minEmploymentMonths !== undefined && { minServiceMonths: minEmploymentMonths }),
      ...(requiresApproval !== undefined && { autoApprove: !requiresApproval }),
      ...(autoApprovalLimit !== undefined && { maxAdvanceAmount: autoApprovalLimit }),
      ...(interestRate !== undefined && { interestRate }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    };

    if (policy) {
      policy = await prisma.salaryAdvancePolicy.update({
        where: { id: policy.id },
        data: updateData
      });
    } else {
      policy = await prisma.salaryAdvancePolicy.create({
        data: {
          tenantId,
          maxAdvancePercentage: maxPercentageOfSalary || 25,
          minServiceMonths: minEmploymentMonths || 6,
          autoApprove: requiresApproval !== undefined ? !requiresApproval : false,
          maxAdvanceAmount: autoApprovalLimit,
          interestRate: interestRate || 0,
          isActive: isActive !== undefined ? isActive : true,
          effectiveDate: new Date(),
          ...updateData
        }
      });
    }

    const settings = {
      id: policy.id,
      maxPercentageOfSalary: policy.maxAdvancePercentage,
      maxRepaymentMonths: 12,
      minEmploymentMonths: policy.minServiceMonths,
      cooldownPeriodDays: 30,
      requiresApproval: !policy.autoApprove,
      autoApprovalLimit: policy.maxAdvanceAmount,
      interestRate: policy.interestRate,
      processingFee: 0,
      isActive: policy.isActive,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString()
    };

    return res.status(200).json({ status: 'success', data: settings });
  } catch (error: any) {
    console.error('Update salary advance settings error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to update salary advance settings' });
  }
};

/**
 * Generate salary advance report
 * @route POST /api/salary-advances/reports/generate
 */
export const generateSalaryAdvanceReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { reportType, parameters } = req.body;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // This is a simplified implementation - in a real system you'd generate actual reports
    const reportId = `report_${Date.now()}`;
    
    const report = {
      id: reportId,
      reportType,
      status: 'completed' as const,
      downloadUrl: `/api/salary-advances/reports/${reportId}/download`,
      generatedAt: new Date().toISOString()
    };

    return res.status(200).json({ status: 'success', data: report });
  } catch (error: any) {
    console.error('Generate salary advance report error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to generate salary advance report' });
  }
};

/**
 * Calculate potential deduction for next payroll
 * @route GET /api/salary-advances/calculate-deduction/:employeeId/:payrollPeriodId
 */
export const calculateSalaryAdvanceDeduction = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId, payrollPeriodId } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const outstandingAdvances = await prisma.salaryAdvanceRequest.findMany({
      where: {
        employeeId,
        tenantId,
        status: 'DISBURSED',
        outstandingBalance: { gt: 0 }
      },
      select: {
        id: true,
        monthlyDeduction: true,
        outstandingBalance: true
      }
    });

    const totalDeduction = outstandingAdvances.reduce((sum, advance) => 
      sum + Math.min(advance.monthlyDeduction, advance.outstandingBalance), 0
    );

    const advances = outstandingAdvances.map(advance => ({
      id: advance.id,
      amount: Math.min(advance.monthlyDeduction, advance.outstandingBalance),
      remainingBalance: advance.outstandingBalance
    }));

    return res.status(200).json({ 
      status: 'success', 
      data: {
        totalDeduction,
        advances
      }
    });
  } catch (error: any) {
    console.error('Calculate salary advance deduction error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to calculate next payroll deduction' });
  }
};

/**
 * Process payroll deductions for salary advances
 * @route POST /api/salary-advances/process-deductions/:payrollPeriodId
 */
export const processSalaryAdvanceDeductions = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { payrollPeriodId } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // This is a simplified implementation
    const result = {
      processed: 0,
      totalAmount: 0,
      failed: 0,
      details: []
    };

    return res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Process payroll deductions error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to process payroll deductions' });
  }
};

/**
 * Get pending approvals for a manager
 * @route GET /api/salary-advances/pending-approvals/:managerId
 */
export const getPendingSalaryAdvanceApprovals = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { managerId } = req.params;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const pendingApprovals = await prisma.salaryAdvanceRequest.findMany({
      where: {
        tenantId,
        status: { in: ['PENDINGOPREVIEW', 'FORWARDEDTOHR'] },
        employee: {
          branch: {
            managerId: managerId
          }
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { requestDate: 'asc' }
    });

    return res.status(200).json({ status: 'success', data: pendingApprovals });
  } catch (error: any) {
    console.error('Get pending salary advance approvals error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to get pending approvals' });
  }
};

/**
 * Bulk approve salary advance requests
 * @route POST /api/salary-advances/bulk-approve
 */
export const bulkApproveSalaryAdvances = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user;
    const { requestIds, approverId } = req.body;
    
    if (!tenantId || !user?.userId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID and userId are required' });
    }

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Request IDs array is required' });
    }

    const approverUserId = approverId || user.userId;
    
    const approvedRequests = await prisma.salaryAdvanceRequest.updateMany({
      where: {
        id: { in: requestIds },
        tenantId,
        status: { in: ['PENDINGOPREVIEW', 'FORWARDEDTOHR'] }
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approverUserId,
        updatedAt: new Date()
      }
    });

    // Fetch the updated requests to return
    const updatedRequests = await prisma.salaryAdvanceRequest.findMany({
      where: {
        id: { in: requestIds },
        tenantId
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        }
      }
    });

    return res.status(200).json({ status: 'success', data: updatedRequests });
  } catch (error: any) {
    console.error('Bulk approve salary advances error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to bulk approve salary advances' });
  }
};

/**
 * Export salary advance data
 * @route GET /api/salary-advances/export
 */
export const exportSalaryAdvanceData = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { format = 'csv' } = req.query;
    
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    // Get salary advance data
    const requests = await prisma.salaryAdvanceRequest.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            branch: { select: { name: true } }
          }
        }
      },
      orderBy: { requestDate: 'desc' }
    });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeader = 'Employee Number,Employee Name,Department,Branch,Requested Amount,Approved Amount,Status,Request Date,Approved Date\n';
      const csvRows = requests.map(req => 
        `${req.employee.employeeNumber},"${req.employee.firstName} ${req.employee.lastName}",${req.employee.department?.name || ''},${req.employee.branch?.name || ''},${req.requestedAmount},${req.approvedAmount || ''},${req.status},${req.requestDate.toISOString()},${req.approvedAt?.toISOString() || ''}`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="salary-advances.csv"');
      return res.send(csvContent);
    } else {
      // For Excel format, return JSON for now (would need a proper Excel library)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="salary-advances.json"');
      return res.json(requests);
    }
  } catch (error: any) {
    console.error('Export salary advance data error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to export salary advance data' });
  }
};
