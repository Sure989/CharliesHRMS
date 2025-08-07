import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { leaveService } from '../services/configuredServices';
import {
  calculateWorkingDays,
  validateLeaveRequest,
  updateLeaveBalance as updateLeaveBalanceService,
  processLeaveRequestDecision,
  // eslint-disable-next-line no-unused-vars
  initializeEmployeeLeaveBalances,
} from '../services/leaveManagement.service';
import { handleDemoMode, handleDemoModeWithPagination } from '../utils/demoModeHelper';
import { getMockDataByTenant } from '../utils/comprehensiveMockData';

/**
 * Get all leave types for a tenant
 * @route GET /api/leave/types
 */
export const getLeaveTypes = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where: { tenantId: req.tenantId, isActive: true },
      include: {
        _count: {
          select: {
            leaveRequests: true,
            leaveBalances: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      status: 'success',
      data: { leaveTypes },
    });
  } catch (error) {
    console.error('Get leave types error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching leave types',
    });
  }
};

/**
 * Create a new leave type
 * @route POST /api/leave/types
 */
export const createLeaveType = async (req: Request, res: Response) => {
  try {
    const { name, code, description, color } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!name || !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and code are required',
      });
    }

    // Check if leave type with same code already exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        code,
        tenantId: req.tenantId,
      },
    });

    if (existingLeaveType) {
      return res.status(409).json({
        status: 'error',
        message: 'Leave type with this code already exists',
      });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        code,
        description,
        color,
        tenantId: req.tenantId,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Leave type created successfully',
      data: { leaveType },
    });
  } catch (error) {
    console.error('Create leave type error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating leave type',
    });
  }
};

/**
 * Submit a leave request
 * @route POST /api/leave/requests
 */
export const submitLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee ID, leave type ID, start date, and end date are required',
      });
    }


    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate leave request
    const validation = await validateLeaveRequest(
      employeeId,
      leaveTypeId,
      start,
      end,
      req.tenantId
    );

    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Leave request validation failed',
        errors: validation.errors,
      });
    }

    // Calculate working days
    const totalDays = await calculateWorkingDays(start, end, req.tenantId);

    // Find approver: branch manager or HR, but if employee is ops manager, always HR
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: req.tenantId },
      include: { user: true },
    });
    let approverId = null;
    let approverRole = null;
    // If employee is ops manager, route to HR
    if (employee?.user?.role === 'OPS_MANAGER' || employee?.position === 'Operations Manager') {
      const hrUser = await prisma.user.findFirst({
        where: { tenantId: req.tenantId, role: leaveService.getHRRole() },
      });
      console.log(`[LeaveRequest] Employee is OPS_MANAGER or position 'Operations Manager'. Routing to HR.`);
      if (hrUser) {
        approverId = hrUser.id;
        approverRole = leaveService.getHRRole();
        console.log(`[LeaveRequest] Approver assigned: HR (userId=${approverId}) for employeeId=${employeeId}`);
      }
    } else if (employee?.branchId) {
      // Get branch and managerUserId
      const branch = await prisma.branch.findFirst({
        where: { id: employee.branchId, tenantId: req.tenantId },
      });
      console.log(`[LeaveRequest] Employee branchId: ${employee.branchId}, branch: ${branch?.name}, managerUserId: ${branch?.managerUserId}`);
      if (branch?.managerUserId) {
        const managerUser = await prisma.user.findUnique({ where: { id: branch.managerUserId } });
        console.log(`[LeaveRequest] Branch managerUserId: ${branch.managerUserId}, managerUser: ${managerUser?.firstName} ${managerUser?.lastName} (role: ${managerUser?.role})`);
        approverId = branch.managerUserId;
        approverRole = 'BRANCH_MANAGER';
        console.log(`[LeaveRequest] Approver assigned: Branch Manager (userId=${approverId}) for branchId=${employee.branchId}, employeeId=${employeeId}`);
      } else {
        console.log(`[LeaveRequest] Branch has no managerUserId assigned.`);
      }
      if (!approverId) {
        // Fallback to HR
        const hrUser = await prisma.user.findFirst({
          where: { tenantId: req.tenantId, role: leaveService.getFallbackApproverRole() },
        });
        if (hrUser) {
          approverId = hrUser.id;
          approverRole = leaveService.getFallbackApproverRole();
          console.log(`[LeaveRequest] Approver fallback: HR (userId=${approverId}) for employeeId=${employeeId}`);
        }
      }
    } else {
      // No branch, fallback to HR
      const hrUser = await prisma.user.findFirst({
        where: { tenantId: req.tenantId, role: leaveService.getFallbackApproverRole() },
      });
      if (hrUser) {
        approverId = hrUser.id;
        approverRole = leaveService.getFallbackApproverRole();
        console.log(`[LeaveRequest] Approver fallback: HR (userId=${approverId}) for employeeId=${employeeId}`);
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        tenantId: req.tenantId,
        branchId: employee?.branchId || null,
        comments: approverRole ? `Routed to ${approverRole}` : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Optionally, notify the approver (implement notification logic here if model exists)

    // Update leave balance
    const year = start.getFullYear();
    await updateLeaveBalanceService(employeeId, leaveTypeId, year, req.tenantId);

    return res.status(201).json({
      status: 'success',
      message: 'Leave request submitted successfully',
      data: { leaveRequest },
    });
  } catch (error) {
    console.error('Submit leave request error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while submitting leave request',
    });
  }
};

/**
 * Get leave requests (with filtering)
 * @route GET /api/leave/requests
 */
export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    const { employeeId, status, leaveTypeId, startDate, endDate, branchName, branchId } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const tenantId = req.tenantId;
    
    const result = await handleDemoModeWithPagination(
      req,
      getMockDataByTenant.leaveRequests(tenantId).map(leave => ({
        ...leave,
        employee: {
          id: leave.employeeId,
          employeeNumber: 'EMP001',
          firstName: 'Demo',
          lastName: 'Employee',
          position: 'Staff',
          branch: { name: 'Demo Branch', managerUserId: 'demo-manager', managerId: 'demo-manager' }
        },
        leaveType: {
          id: leave.leaveTypeId,
          name: 'Annual Leave',
          code: 'AL',
          color: '#4CAF50'
        },
        managerUserId: 'demo-manager',
        managerId: 'demo-manager'
      })),
      async () => {
        const where = { tenantId: req.tenantId } as any;

        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (leaveTypeId) where.leaveTypeId = leaveTypeId;
        if (startDate && endDate) {
          where.startDate = { gte: new Date(startDate as string) };
          where.endDate = { lte: new Date(endDate as string) };
        }

        // Filter by branch for operations managers
        if (req.user?.role === 'OPS_MANAGER') {
          const userEmployee = await prisma.employee.findFirst({
            where: { 
              user: { id: req.user.userId },
              tenantId: req.tenantId 
            }
          });
          
          if (userEmployee?.branchId) {
            where.branchId = userEmployee.branchId;
          }
        }
        
        if (branchName || branchId) {
          where.employee = {};
          if (branchName) {
            where.employee.branch = {
              is: { name: { equals: branchName, mode: 'insensitive' } }
            };
          }
          if (branchId) {
            where.branchId = branchId;
          }
        }

        const leaveRequests = await prisma.leaveRequest.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                position: true,
                branch: {
                  select: {
                    name: true,
                    managerUserId: true,
                    managerId: true,
                  },
                },
              },
            },
            leaveType: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        });

        const enrichedLeaveRequests = leaveRequests.map((req: any) => ({
          ...req,
          managerUserId: req.employee?.branch?.managerUserId || '',
          managerId: req.employee?.branch?.managerId || (req.employee?.position === 'Operations Manager' ? req.employee.id : ''),
        }));

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        return {
          data: enrichedLeaveRequests,
          total: enrichedLeaveRequests.length,
          page,
          limit
        };
      }
    );

    return res.status(200).json({
      status: 'success',
      data: { leaveRequests: result.data },
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error('General error in getLeaveRequests:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching leave requests',
      details: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Approve or reject a leave request
 * @route PUT /api/leave/requests/:id/decision
 */
export const processLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;

    if (!req.tenantId || !req.user?.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid decision (APPROVED or REJECTED) is required',
      });
    }

    await processLeaveRequestDecision(id, decision, req.user.userId, reason, req.tenantId);

    const updatedRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Optionally, notify the employee (implement notification logic here if model exists)

    return res.status(200).json({
      status: 'success',
      message: `Leave request ${decision.toLowerCase()} successfully`,
      data: { leaveRequest: updatedRequest },
    });
  } catch (error) {
    console.error('Process leave request error:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error while processing leave request',
    });
  }
};

/**
 * Get leave balances for an employee
 * @route GET /api/leave/balances/:employeeId
 */
export const getLeaveBalances = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
        tenantId: req.tenantId,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
      },
      orderBy: {
        leaveType: {
          name: 'asc',
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { leaveBalances, year: currentYear },
    });
  } catch (error) {
    console.error('Get leave balances error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching leave balances',
    });
  }
};

/**
 * Get holidays for a tenant
 * @route GET /api/leave/holidays
 */
export const getHolidays = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const holidays = await prisma.holiday.findMany({
      where: {
        tenantId: req.tenantId,
        isActive: true,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: { date: 'asc' },
    });

    return res.status(200).json({
      status: 'success',
      data: { holidays, year: currentYear },
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching holidays',
    });
  }
};

/**
 * Create a holiday
 * @route POST /api/leave/holidays
 */
export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { name, date, type, description, isRecurring } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!name || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and date are required',
      });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        type: type || 'PUBLIC',
        description,
        isRecurring: isRecurring || false,
        tenantId: req.tenantId,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Holiday created successfully',
      data: { holiday },
    });
  } catch (error) {
    console.error('Create holiday error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating holiday',
    });
  }
};

export const updateLeaveType = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const deleteLeaveType = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const updateLeaveBalance = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getLeaveRequestById = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const updateLeaveRequest = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const cancelLeaveRequest = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const bulkApproveLeaveRequests = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getLeaveCalendar = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getLeaveStatistics = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const exportLeaveData = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getPendingApprovals = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const checkLeaveConflicts = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getLeavePolicy = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};
