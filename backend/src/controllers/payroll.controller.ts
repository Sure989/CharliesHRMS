/**
 * Update a payroll period
 * @route PUT /api/payroll/periods/:id
 */
export const updatePayrollPeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, payDate, description } = req.body;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    if (!id || !name || !startDate || !endDate || !payDate) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }
    // Check if period exists
    const period = await prisma.payrollPeriod.findFirst({
      where: { id, tenantId: req.tenantId },
    });
    if (!period) {
      return res.status(404).json({ status: 'error', message: 'Payroll period not found' });
    }
    // Update period
    const updated = await prisma.payrollPeriod.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payDate: new Date(payDate),
        description,
      },
    });
    return res.status(200).json({ status: 'success', message: 'Payroll period updated', data: updated });
  } catch (error) {
    console.error('Update payroll period error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while updating payroll period' });
  }
};
/**
 * Process payroll for all employees in a specific period (single period processing)
 * @route POST /api/payroll/periods/:periodId/process
 */
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calculatePayroll as calculatePayrollService, generatePayStubNumber } from '../services/payrollCalculation.service';

export const processPayrollForPeriod = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    // Check if payroll period exists
    const period = await prisma.payrollPeriod.findFirst({
      where: { id: periodId, tenantId: req.tenantId },
    });
    if (!period) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll period not found',
      });
    }
    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { tenantId: req.tenantId, status: 'ACTIVE' },
    });
    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    };
    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await prisma.payroll.findFirst({
          where: {
            employeeId: employee.id,
            payrollPeriodId: periodId,
            tenantId: req.tenantId,
          },
        });
        if (existingPayroll) {
          results.skipped++;
          results.details.push({
            employeeId: employee.id,
            employeeNumber: employee.employeeNumber,
            name: `${employee.firstName} ${employee.lastName}`,
            status: 'skipped',
            reason: 'Payroll already exists',
          });
          continue;
        }
        // Use employee's base salary or default
        const basicSalary = employee.salary || 0;
        if (basicSalary <= 0) {
          results.errors++;
          results.details.push({
            employeeId: employee.id,
            employeeNumber: employee.employeeNumber,
            name: `${employee.firstName} ${employee.lastName}`,
            status: 'error',
            reason: 'No salary configured',
          });
          continue;
        }
        // Calculate payroll
        const calculation = await calculatePayrollService({
          employeeId: employee.id,
          payrollPeriodId: periodId,
          basicSalary,
          allowances: [],
          tenantId: req.tenantId,
        });
        // Create payroll record
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            payrollPeriodId: periodId,
            basicSalary: calculation.basicSalary,
            grossSalary: calculation.grossSalary,
            totalDeductions: calculation.totalDeductions,
            netSalary: calculation.netSalary,
            tenantId: req.tenantId,
          },
        });
        // Create payroll items
        await Promise.all(
          calculation.payrollItems.map(item =>
            prisma.payrollItem.create({
              data: {
                payrollId: payroll.id,
                type: item.type,
                category: item.category,
                name: item.name,
                amount: item.amount,
                isStatutory: item.isStatutory,
                tenantId: req.tenantId!,
              },
            })
          )
        );
        // Generate pay stub
        const stubNumber = await generatePayStubNumber(req.tenantId);
        await prisma.payStub.create({
          data: {
            employeeId: employee.id,
            payrollId: payroll.id,
            payrollPeriodId: periodId,
            stubNumber,
            tenantId: req.tenantId,
          },
        });
        results.processed++;
        results.details.push({
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          status: 'processed',
          netSalary: calculation.netSalary,
        });
      } catch (error) {
        console.error(`Error processing payroll for employee ${employee.id}:`, error);
        results.errors++;
        results.details.push({
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          status: 'error',
          reason: 'Processing failed',
        });
      }
    }
    return res.status(200).json({
      status: 'success',
      message: 'Payroll processing completed for period',
      data: { results },
    });
  } catch (error) {
    console.error('Process payroll for period error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing payroll for period',
    });
  }
};
/**
 * Delete payroll for a specific employee and period (for reprocessing)
 * @route DELETE /api/payroll/:employeeId/:periodId
 */
export const deletePayrollForEmployeePeriod = async (req: Request, res: Response) => {
  const { employeeId, periodId } = req.params;
  if (!employeeId || !periodId) {
    return res.status(400).json({ status: 'error', message: 'employeeId and periodId are required' });
  }
  try {
    const deleted = await prisma.payroll.deleteMany({
      where: {
        employeeId,
        payrollPeriodId: periodId,
        tenantId: req.tenantId,
      },
    });
    if (deleted.count === 0) {
      return res.status(404).json({ status: 'error', message: 'No payroll record found to delete' });
    }
    return res.json({ status: 'success', message: 'Payroll record deleted', count: deleted.count });
  } catch (error) {
    console.error('Delete payroll error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while deleting payroll' });
  }
};

/**
 * Get all payroll periods for a tenant
 * @route GET /api/payroll/periods
 */
export const getPayrollPeriods = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const periods = await prisma.payrollPeriod.findMany({
      where: { tenantId: req.tenantId },
      include: {
        _count: {
          select: {
            payrolls: true,
            payStubs: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: periods,
    });
  } catch (error) {
    console.error('Get payroll periods error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching payroll periods',
    });
  }
};

/**
 * Create a new payroll period
 * @route POST /api/payroll/periods
 */
export const createPayrollPeriod = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, payDate, description } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!name || !startDate || !endDate || !payDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, start date, end date, and pay date are required',
      });
    }

    // Check if period with same name already exists
    const existingPeriod = await prisma.payrollPeriod.findFirst({
      where: {
        name,
        tenantId: req.tenantId,
      },
    });

    if (existingPeriod) {
      return res.status(409).json({
        status: 'error',
        message: 'Payroll period with this name already exists',
      });
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payDate: new Date(payDate),
        description,
        tenantId: req.tenantId,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Payroll period created successfully',
      data: { period },
    });
  } catch (error) {
    console.error('Create payroll period error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating payroll period',
    });
  }
};

/**
 * Get payrolls for a specific period
 * @route GET /api/payroll/periods/:periodId/payrolls
 */
export const getPayrollsByPeriod = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const payrolls = await prisma.payroll.findMany({
      where: {
        payrollPeriodId: periodId,
        tenantId: req.tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        payrollItems: true,
        payStub: {
          select: {
            id: true,
            stubNumber: true,
            status: true,
            generatedAt: true,
          },
        },
      },
      orderBy: {
        employee: {
          employeeNumber: 'asc',
        },
      },
    });

    // Map statutory deductions from payrollItems
    const mappedPayrolls = payrolls.map(payroll => {
      // Aggregate statutory deductions
      const statutoryDeductions = { paye: 0, nhif: 0, nssf: 0, total: 0 };
      if (Array.isArray(payroll.payrollItems)) {
        payroll.payrollItems.forEach(item => {
          if (item.isStatutory) {
            const name = (item.name || '').toLowerCase();
            if (name.includes('paye')) statutoryDeductions.paye += Number(item.amount) || 0;
            else if (name.includes('nhif')) statutoryDeductions.nhif += Number(item.amount) || 0;
            else if (name.includes('nssf')) statutoryDeductions.nssf += Number(item.amount) || 0;
            statutoryDeductions.total += Number(item.amount) || 0;
          }
        });
      }
      return {
        ...payroll,
        statutoryDeductions,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: { payrolls: mappedPayrolls },
    });
  } catch (error) {
    console.error('Get payrolls by period error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching payrolls',
    });
  }
};

/**
 * Process payroll for a specific employee and period
 * @route POST /api/payroll/process
 */
export const processPayroll = async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      payrollPeriodId,
      basicSalary,
      allowances = [],
      overtime,
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!employeeId || !payrollPeriodId || basicSalary === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee ID, payroll period ID, and basic salary are required',
      });
    }

    // Check if employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: req.tenantId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    // Check if payroll period exists
    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id: payrollPeriodId,
        tenantId: req.tenantId,
      },
    });

    if (!period) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll period not found',
      });
    }

    // Check if payroll already exists for this employee and period
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        employeeId,
        payrollPeriodId,
        tenantId: req.tenantId,
      },
    });

    if (existingPayroll) {
      return res.status(409).json({
        status: 'error',
        message: 'Payroll already exists for this employee and period',
      });
    }

    // Calculate payroll
    const calculation = await calculatePayrollService({
      employeeId,
      payrollPeriodId,
      basicSalary,
      allowances,
      overtime,
      tenantId: req.tenantId,
    });

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        payrollPeriodId,
        basicSalary: calculation.basicSalary,
        grossSalary: calculation.grossSalary,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        tenantId: req.tenantId,
      },
    });

    // Create payroll items
    await Promise.all(
      calculation.payrollItems.map(item =>
        prisma.payrollItem.create({
          data: {
            payrollId: payroll.id,
            type: item.type,
            category: item.category,
            name: item.name,
            amount: item.amount,
            isStatutory: item.isStatutory,
            tenantId: req.tenantId!,
          },
        })
      )
    );

    // Generate pay stub
    const _stubNumber = await generatePayStubNumber(req.tenantId);
    // eslint-disable-next-line no-unused-vars
    const _payStub = await prisma.payStub.create({
      data: {
        employeeId,
        payrollId: payroll.id,
        payrollPeriodId,
        stubNumber: _stubNumber,
        tenantId: req.tenantId,
      },
    });

    // Fetch complete payroll with relations
    const completePayroll = await prisma.payroll.findUnique({
      where: { id: payroll.id },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        payrollItems: true,
        payStub: true,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Payroll processed successfully',
      data: { payroll: completePayroll },
    });
  } catch (error) {
    console.error('Process payroll error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing payroll',
    });
  }
};

/**
 * Bulk process payroll for all employees in a period
 * @route POST /api/payroll/periods/:periodId/process-all
 */
export const bulkProcessPayroll = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Check if payroll period exists
    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id: periodId,
        tenantId: req.tenantId,
      },
    });

    if (!period) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll period not found',
      });
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: req.tenantId,
        status: 'ACTIVE',
      },
    });

    console.log(`[BULK PAYROLL] Found ${employees.length} active employees`);
    console.log(`[BULK PAYROLL] Employees with salaries:`, employees.filter(emp => emp.salary && emp.salary > 0).map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      salary: emp.salary
    })));

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    };

    // Process each employee
    for (const employee of employees) {
      try {
        console.log(`[BULK PAYROLL] Processing employee: ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Salary: ${employee.salary})`);
        
        // Check if payroll already exists
        const existingPayroll = await prisma.payroll.findFirst({
          where: {
            employeeId: employee.id,
            payrollPeriodId: periodId,
            tenantId: req.tenantId,
          },
        });

        if (existingPayroll) {
          console.log(`[BULK PAYROLL] Skipping employee ${employee.firstName} ${employee.lastName} - payroll already exists`);
          results.skipped++;
          results.details.push({
            employeeId: employee.id,
            employeeNumber: employee.employeeNumber,
            name: `${employee.firstName} ${employee.lastName}`,
            status: 'skipped',
            reason: 'Payroll already exists',
          });
          continue;
        }

        // Use employee's base salary or default
        const basicSalary = employee.salary || 0;

        if (basicSalary <= 0) {
          console.log(`[BULK PAYROLL] Error for employee ${employee.firstName} ${employee.lastName} - no salary configured`);
          results.errors++;
          results.details.push({
            employeeId: employee.id,
            employeeNumber: employee.employeeNumber,
            name: `${employee.firstName} ${employee.lastName}`,
            status: 'error',
            reason: 'No salary configured',
          });
          continue;
        }

        // Calculate payroll
        const calculation = await calculatePayrollService({
          employeeId: employee.id,
          payrollPeriodId: periodId,
          basicSalary,
          allowances: [], // Can be extended to include default allowances
          tenantId: req.tenantId,
        });

        // Create payroll record
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            payrollPeriodId: periodId,
            basicSalary: calculation.basicSalary,
            grossSalary: calculation.grossSalary,
            totalDeductions: calculation.totalDeductions,
            netSalary: calculation.netSalary,
            tenantId: req.tenantId,
          },
        });

        // Create payroll items
        await Promise.all(
          calculation.payrollItems.map(item =>
            prisma.payrollItem.create({
              data: {
                payrollId: payroll.id,
                type: item.type,
                category: item.category,
                name: item.name,
                amount: item.amount,
                isStatutory: item.isStatutory,
                tenantId: req.tenantId!,
              },
            })
          )
        );

        // Generate pay stub
        const stubNumber = await generatePayStubNumber(req.tenantId);
        await prisma.payStub.create({
          data: {
            employeeId: employee.id,
            payrollId: payroll.id,
            payrollPeriodId: periodId,
            stubNumber,
            tenantId: req.tenantId,
          },
        });

        results.processed++;
        results.details.push({
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          status: 'processed',
          netSalary: calculation.netSalary,
        });
        
        console.log(`[BULK PAYROLL] Successfully processed employee ${employee.firstName} ${employee.lastName} - Net Salary: ${calculation.netSalary}`);
      } catch (error) {
        console.error(`[BULK PAYROLL] Error processing payroll for employee ${employee.id}:`, error);
        results.errors++;
        results.details.push({
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          status: 'error',
          reason: 'Processing failed',
        });
      }
    }

    console.log(`[BULK PAYROLL] Processing complete. Processed: ${results.processed}, Skipped: ${results.skipped}, Errors: ${results.errors}`);

    return res.status(200).json({
      status: 'success',
      message: 'Bulk payroll processing completed',
      data: { results },
    });
  } catch (error) {
    console.error('Bulk process payroll error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while bulk processing payroll',
    });
  }
};

/**
 * Get pay stub by ID
 * @route GET /api/payroll/pay-stubs/:id
 */
export const getPayStub = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const payStub = await prisma.payStub.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: {
              select: {
                name: true,
              },
            },
            branch: {
              select: {
                name: true,
              },
            },
          },
        },
        payroll: {
          include: {
            payrollItems: true,
          },
        },
        payrollPeriod: true,
      },
    });

    if (!payStub) {
      return res.status(404).json({
        status: 'error',
        message: 'Pay stub not found',
      });
    }

    // Mark as viewed if not already
    if (payStub.status === 'GENERATED') {
      await prisma.payStub.update({
        where: { id },
        data: { status: 'VIEWED' },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { payStub },
    });
  } catch (error) {
    console.error('Get pay stub error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching pay stub',
    });
  }
};

/**
 * Get all pay stubs with filters
 * @route GET /api/payroll/pay-stubs
 */
export const getPayStubs = async (req: Request, res: Response) => {
  try {
    const { employeeId, periodId } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const whereClause: any = { tenantId: req.tenantId };
    if (employeeId) whereClause.employeeId = employeeId;
    if (periodId) whereClause.payrollPeriodId = periodId;

    const payStubs = await prisma.payStub.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        payrollPeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: payStubs,
    });
  } catch (error) {
    console.error('Get pay stubs error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching pay stubs',
    });
  }
};

/**
 * Get time entries
 * @route GET /api/payroll/time-entries
 */
export const getTimeEntries = async (req: Request, res: Response) => {
  try {
    // Removed unused variables: employeeId, periodId, startDate, endDate

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Since time entries table doesn't exist in schema, return empty array
    // This can be extended when time tracking is implemented
    const timeEntries: any[] = [];

    return res.status(200).json({
      status: 'success',
      data: timeEntries,
      message: 'Time tracking feature not yet implemented'
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching time entries',
    });
  }
};

/**
 * Save time entry
 * @route POST /api/payroll/time-entries
 */
export const saveTimeEntry = async (req: Request, res: Response) => {
  try {
    const { employeeId, date, clockIn, clockOut, hoursWorked, overtimeHours } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!employeeId || !date || !clockIn || !clockOut) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee ID, date, clock in, and clock out are required',
      });
    }

    // Mock response for time entry creation
    const timeEntry = {
      id: `te_${Date.now()}`,
      employeeId,
      date,
      clockIn,
      clockOut,
      hoursWorked: hoursWorked || 8,
      overtimeHours: overtimeHours || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json({
      status: 'success',
      message: 'Time entry saved successfully',
      data: timeEntry,
    });
  } catch (error) {
    console.error('Save time entry error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while saving time entry',
    });
  }
};

/**
 * Get tax tables
 * @route GET /api/payroll/tax-tables
 */
export const getTaxTables = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const whereClause: any = { 
      tenantId: req.tenantId,
      isActive: true 
    };

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      whereClause.effectiveDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const taxBrackets = await prisma.taxBracket.findMany({
      where: whereClause,
      orderBy: [
        { effectiveDate: 'desc' },
        { minAmount: 'asc' }
      ]
    });

    // Group tax brackets by name/type to create tax tables
    const taxTablesMap = new Map();
    
    taxBrackets.forEach((bracket: any) => {
      if (!taxTablesMap.has(bracket.name)) {
        taxTablesMap.set(bracket.name, {
          id: bracket.name.toLowerCase().replace(/\s+/g, '_'),
          name: bracket.name,
          effectiveDate: bracket.effectiveDate,
          brackets: []
        });
      }
      
      const table = taxTablesMap.get(bracket.name);
      table.brackets.push({
        id: bracket.id,
        min: bracket.minAmount,
        max: bracket.maxAmount,
        rate: bracket.rate,
        fixedAmount: bracket.fixedAmount
      });
    });

    const taxTables = Array.from(taxTablesMap.values());

    return res.status(200).json({
      status: 'success',
      data: taxTables,
    });
  } catch (error) {
    console.error('Get tax tables error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching tax tables',
    });
  }
};

/**
 * Update tax table
 * @route PUT /api/payroll/tax-tables/:id
 */
export const updateTaxTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { brackets, personalRelief, insuranceRelief } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Mock update response
    const updatedTaxTable = {
      id,
      year: 2024,
      country: 'Kenya',
      type: 'PAYE',
      brackets: brackets || [
        { min: 0, max: 24000, rate: 0.10 },
        { min: 24001, max: 32333, rate: 0.25 },
        { min: 32334, max: 500000, rate: 0.30 },
        { min: 500001, max: 800000, rate: 0.325 },
        { min: 800001, max: null, rate: 0.35 }
      ],
      personalRelief: personalRelief || 2400,
      insuranceRelief: insuranceRelief || 5000,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      status: 'success',
      message: 'Tax table updated successfully',
      data: updatedTaxTable,
    });
  } catch (error) {
    console.error('Update tax table error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating tax table',
    });
  }
};

/**
 * Generate payroll report
 * @route POST /api/payroll/reports/generate
 */
export const generatePayrollReport = async (req: Request, res: Response) => {
  try {
    const { reportType, parameters } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!reportType) {
      return res.status(400).json({
        status: 'error',
        message: 'Report type is required',
      });
    }

    // Get actual payroll data for the report
    const whereClause: any = { tenantId: req.tenantId };
    if (parameters?.periodId) {
      whereClause.payrollPeriodId = parameters.periodId;
    }
    if (parameters?.startDate && parameters?.endDate) {
      whereClause.createdAt = {
        gte: new Date(parameters.startDate),
        lte: new Date(parameters.endDate)
      };
    }

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
            department: { select: { name: true } },
            branch: { select: { name: true } }
          }
        },
        payrollItems: true,
        payrollPeriod: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    // Calculate report summary from actual data
    const summary = {
      totalEmployees: payrolls.length,
      totalGrossPay: payrolls.reduce((sum: number, p: any) => sum + p.grossSalary, 0),
      totalNetPay: payrolls.reduce((sum: number, p: any) => sum + p.netSalary, 0),
      totalDeductions: payrolls.reduce((sum: number, p: any) => sum + p.totalDeductions, 0)
    };

    // Create report instance in database
    const reportId = `report_${Date.now()}`;
    const report = await prisma.reportInstance.create({
      data: {
        id: reportId,
        templateId: 'payroll_template', // This would reference an actual template
        name: `${reportType.replace('_', ' ').toUpperCase()} Report`,
        description: `Generated ${reportType} report`,
        parameters: parameters || {},
        status: 'COMPLETED',
        data: { payrolls, summary },
        fileFormat: 'JSON',
        recordCount: payrolls.length,
        generatedBy: 'system', // This should be the actual user ID
        tenantId: req.tenantId
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Report generated successfully',
      data: {
        id: report.id,
        type: reportType,
        title: report.name,
        parameters: report.parameters,
        status: report.status.toLowerCase(),
        generatedAt: report.generatedAt.toISOString(),
        downloadUrl: `/api/payroll/reports/${report.id}/download`,
        summary
      },
    });
  } catch (error) {
    console.error('Generate payroll report error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while generating report',
    });
  }
};

/**
 * Get payroll reports
 * @route GET /api/payroll/reports
 */
export const getPayrollReports = async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const whereClause: any = { 
      tenantId: req.tenantId,
      templateId: { contains: 'payroll' } // Filter for payroll-related reports
    };

    if (type) {
      whereClause.name = { contains: type };
    }

    if (startDate && endDate) {
      whereClause.generatedAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const reports = await prisma.reportInstance.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        generatedAt: true,
        fileFormat: true,
        recordCount: true,
        generatedBy: true
      },
      orderBy: { generatedAt: 'desc' }
    });

    // Transform to match expected format
    const transformedReports = reports.map((report: any) => ({
      id: report.id,
      type: report.name.toLowerCase().replace(/\s+/g, '_'),
      title: report.name,
      status: report.status.toLowerCase(),
      generatedAt: report.generatedAt.toISOString(),
      downloadUrl: `/api/payroll/reports/${report.id}/download`,
      recordCount: report.recordCount,
      format: report.fileFormat
    }));

    return res.status(200).json({
      status: 'success',
      data: transformedReports,
    });
  } catch (error) {
    console.error('Get payroll reports error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching reports',
    });
  }
};

/**
 * Get payroll statistics
 * @route GET /api/payroll/statistics
 */
export const getPayrollStatistics = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Get actual payroll data if available
    const payrolls = await prisma.payroll.findMany({
      where: {
        tenantId: req.tenantId,
        ...(periodId && { payrollPeriodId: periodId as string })
      }
    });

    // If no payroll records exist, get employee count from Employee table
    let totalEmployees = payrolls.length;
    if (totalEmployees === 0) {
      const employeeCount = await prisma.employee.count({
        where: {
          tenantId: req.tenantId,
          status: 'ACTIVE'
        }
      });
      totalEmployees = employeeCount;
    }

    const statistics = {
      totalEmployees,
      totalGrossPay: payrolls.reduce((sum: number, p: any) => sum + (p.grossSalary || 0), 0),
      totalNetPay: payrolls.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0),
      totalStatutoryDeductions: payrolls.reduce((sum: number, p: any) => sum + (p.totalDeductions || 0), 0),
      totalOtherDeductions: 0,
      averageSalary: payrolls.length > 0 ? payrolls.reduce((sum: number, p: any) => sum + (p.grossSalary || 0), 0) / payrolls.length : 0,
      payrollCost: payrolls.reduce((sum: number, p: any) => sum + (p.grossSalary || 0), 0) * 1.12 // Including employer contributions
    };

    return res.status(200).json({
      status: 'success',
      data: statistics,
    });
  } catch (error) {
    console.error('Get payroll statistics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching statistics',
    });
  }
};

/**
 * Get payroll settings
 * @route GET /api/payroll/settings
 */
export const getPayrollSettings = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Get payroll settings from database
    let settings = await prisma.payrollSettings.findUnique({
      where: { tenantId: req.tenantId }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.payrollSettings.create({
        data: {
          tenantId: req.tenantId,
          // Default values are defined in the schema
        }
      });
    }

    // Format response to match frontend expectations
    const formattedSettings = {
      companyInfo: {
        name: settings.companyName || "",
        kraPin: settings.kraPin || "",
        nssfNumber: settings.nssfNumber || "",
        nhifNumber: settings.nhifNumber || "",
        address: settings.companyAddress || "",
        postalCode: settings.companyPostalCode || "",
        city: settings.companyCity || ""
      },
      payrollDefaults: {
        personalRelief: settings.personalRelief,
        overtimeMultiplier: settings.overtimeMultiplier,
        workingDaysPerMonth: settings.workingDaysPerMonth,
        workingHoursPerDay: settings.workingHoursPerDay,
        payFrequency: settings.payFrequency,
        payDay: settings.payDay,
        cutoffDay: settings.cutoffDay
      },
      approvalWorkflow: {
        requirePayrollApproval: settings.requirePayrollApproval,
        approvalLevels: settings.approvalLevels,
        autoApproveThreshold: settings.autoApproveThreshold,
        notifyEmployeesOnPayment: settings.notifyEmployeesOnPayment,
        sendPayslipsByEmail: settings.sendPayslipsByEmail
      },
      bankingInfo: {
        bankName: settings.bankName || "",
        accountNumber: settings.accountNumber || "",
        branchCode: settings.branchCode || "",
        swiftCode: settings.swiftCode || ""
      }
    };

    return res.status(200).json({
      status: 'success',
      data: formattedSettings,
    });
  } catch (error) {
    console.error('Get payroll settings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching settings',
    });
  }
};

/**
 * Update payroll settings
 * @route PUT /api/payroll/settings
 */
export const updatePayrollSettings = async (req: Request, res: Response) => {
  try {
    const settingsData = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Extract and transform data from frontend format to database format
    const updateData = {
      // Company Info
      companyName: settingsData.companyInfo?.name,
      kraPin: settingsData.companyInfo?.kraPin,
      nssfNumber: settingsData.companyInfo?.nssfNumber,
      nhifNumber: settingsData.companyInfo?.nhifNumber,
      companyAddress: settingsData.companyInfo?.address,
      companyPostalCode: settingsData.companyInfo?.postalCode,
      companyCity: settingsData.companyInfo?.city,
      
      // Payroll Defaults
      personalRelief: settingsData.payrollDefaults?.personalRelief,
      overtimeMultiplier: settingsData.payrollDefaults?.overtimeMultiplier,
      workingDaysPerMonth: settingsData.payrollDefaults?.workingDaysPerMonth,
      workingHoursPerDay: settingsData.payrollDefaults?.workingHoursPerDay,
      payFrequency: settingsData.payrollDefaults?.payFrequency,
      payDay: settingsData.payrollDefaults?.payDay,
      cutoffDay: settingsData.payrollDefaults?.cutoffDay,
      
      // Approval Workflow
      requirePayrollApproval: settingsData.approvalWorkflow?.requirePayrollApproval,
      approvalLevels: settingsData.approvalWorkflow?.approvalLevels,
      autoApproveThreshold: settingsData.approvalWorkflow?.autoApproveThreshold,
      notifyEmployeesOnPayment: settingsData.approvalWorkflow?.notifyEmployeesOnPayment,
      sendPayslipsByEmail: settingsData.approvalWorkflow?.sendPayslipsByEmail,
      
      // Banking Info
      bankName: settingsData.bankingInfo?.bankName,
      accountNumber: settingsData.bankingInfo?.accountNumber,
      branchCode: settingsData.bankingInfo?.branchCode,
      swiftCode: settingsData.bankingInfo?.swiftCode,
      
      updatedAt: new Date()
    };

    // Upsert the settings (update if exists, create if not)
    const updatedSettings = await prisma.payrollSettings.upsert({
      where: { tenantId: req.tenantId },
      update: updateData,
      create: {
        tenantId: req.tenantId,
        ...updateData
      }
    });

    // Format response to match frontend expectations
    const formattedSettings = {
      companyInfo: {
        name: updatedSettings.companyName || "",
        kraPin: updatedSettings.kraPin || "",
        nssfNumber: updatedSettings.nssfNumber || "",
        nhifNumber: updatedSettings.nhifNumber || "",
        address: updatedSettings.companyAddress || "",
        postalCode: updatedSettings.companyPostalCode || "",
        city: updatedSettings.companyCity || ""
      },
      payrollDefaults: {
        personalRelief: updatedSettings.personalRelief,
        overtimeMultiplier: updatedSettings.overtimeMultiplier,
        workingDaysPerMonth: updatedSettings.workingDaysPerMonth,
        workingHoursPerDay: updatedSettings.workingHoursPerDay,
        payFrequency: updatedSettings.payFrequency,
        payDay: updatedSettings.payDay,
        cutoffDay: updatedSettings.cutoffDay
      },
      approvalWorkflow: {
        requirePayrollApproval: updatedSettings.requirePayrollApproval,
        approvalLevels: updatedSettings.approvalLevels,
        autoApproveThreshold: updatedSettings.autoApproveThreshold,
        notifyEmployeesOnPayment: updatedSettings.notifyEmployeesOnPayment,
        sendPayslipsByEmail: updatedSettings.sendPayslipsByEmail
      },
      bankingInfo: {
        bankName: updatedSettings.bankName || "",
        accountNumber: updatedSettings.accountNumber || "",
        branchCode: updatedSettings.branchCode || "",
        swiftCode: updatedSettings.swiftCode || ""
      }
    };

    return res.status(200).json({
      status: 'success',
      message: 'Payroll settings updated successfully',
      data: formattedSettings,
    });
  } catch (error) {
    console.error('Update payroll settings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating settings',
    });
  }
};

/**
 * Get compliance reports
 * @route GET /api/payroll/compliance
 */
export const getComplianceReports = async (req: Request, res: Response) => {
  try {
    // Removed unused variables: type, year, month

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Mock compliance reports
    const reports = [
      {
        id: 'compliance_1',
        type: 'paye_return',
        title: 'PAYE Monthly Return',
        period: '2024-01',
        status: 'completed',
        generatedAt: '2024-02-01T10:00:00Z',
        downloadUrl: '/api/payroll/compliance/compliance_1/download'
      },
      {
        id: 'compliance_2',
        type: 'nssf_return',
        title: 'NSSF Monthly Return',
        period: '2024-01',
        status: 'completed',
        generatedAt: '2024-02-01T11:00:00Z',
        downloadUrl: '/api/payroll/compliance/compliance_2/download'
      }
    ];

    return res.status(200).json({
      status: 'success',
      data: reports,
    });
  } catch (error) {
    console.error('Get compliance reports error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching compliance reports',
    });
  }
};

/**
 * Generate compliance report
 * @route POST /api/payroll/compliance/generate
 */
export const generateComplianceReport = async (req: Request, res: Response) => {
  try {
    const { reportType, period, year, month } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!reportType || !period) {
      return res.status(400).json({
        status: 'error',
        message: 'Report type and period are required',
      });
    }

    // Mock compliance report generation
    const report = {
      id: `compliance_${Date.now()}`,
      type: reportType,
      title: `${reportType.replace('_', ' ').toUpperCase()} Report`,
      period,
      year,
      month,
      status: 'completed',
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/payroll/compliance/compliance_${Date.now()}/download`,
      summary: {
        totalEmployees: 50,
        totalTaxDeducted: 300000,
        totalNSSF: 150000,
        totalNHIF: 75000
      }
    };

    return res.status(201).json({
      status: 'success',
      message: 'Compliance report generated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Generate compliance report error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while generating compliance report',
    });
  }
};

/**
 * Get payroll audit logs
 * @route GET /api/payroll/audit-logs
 */
export const getPayrollAuditLogs = async (req: Request, res: Response) => {
  try {
    const { entityType, startDate, endDate } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Build query filters
    const filters: any = { tenantId: req.tenantId };
    if (entityType) filters.entity = entityType;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.gte = new Date(startDate as string);
      if (endDate) filters.createdAt.lte = new Date(endDate as string);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: filters,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // limit for performance
    });

    // Format logs for frontend compatibility
    const formattedLogs = auditLogs.map((log: any) => ({
      id: log.id,
      entityType: log.entity,
      entityId: log.entityId,
      action: log.action,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : undefined,
      timestamp: log.createdAt,
      changes: log.details || {},
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedLogs,
    });
  } catch (error) {
    console.error('Get payroll audit logs error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching audit logs',
    });
  }
};

/**
 * Get payroll employees
 * @route GET /api/payroll/employees
 */
export const getPayrollEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { periodId, employeeId, department, branch, status } = req.query;


    // Build where clause
    const whereClause: any = {
      tenantId: req.tenantId,
    };

    // If specific employee requested
    if (employeeId) {
      // Check if employeeId is UUID or employeeNumber
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId as string);
      if (isUuid) {
        whereClause.id = employeeId as string;
      } else {
        whereClause.employeeNumber = employeeId as string;
      }
    }

    // If department filter requested
    if (department) {
      whereClause.department = department as string;
    }

    // If branch filter requested
    if (branch) {
      whereClause.branch = branch as string;
    }

    // If status filter requested
    if (status) {
      whereClause.status = status as string;
    }

    // Get employees with their compensation info
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        branch: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payrolls: periodId ? {
          where: {
            payrollPeriodId: periodId as string,
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        } : false,
      },
      orderBy: {
        employeeNumber: 'asc',
      },
    });

    // Transform to payroll employee format
    const payrollEmployees = employees.map((emp: any) => ({
      id: emp.id,
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      employeeId: emp.employeeNumber, // Use employeeNumber from Employee model
      department: emp.department?.name || 'Unknown',
      branch: emp.branch?.name || 'Head Office',
      position: emp.position || 'Staff',
      hireDate: emp.hireDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      status: emp.status === 'ACTIVE' ? 'active' : 'inactive',
      payrollInfo: {
        employeeType: 'salaried', // Default to salaried since we don't have employmentType field
        monthlySalary: emp.salary || 0,
        hourlyRate: 0, // Default to 0 since we don't have hourlyRate field
        overtimeRate: 0, // Default to 0
        bankAccount: {
          accountNumber: '', // These fields don't exist in Employee model
          bankName: '',
          branchCode: '',
          accountType: 'savings' as const,
          swiftCode: undefined,
        },
        taxInfo: {
          kraPin: '', // These fields don't exist in Employee model
          nssfNumber: '',
          nhifNumber: '',
          personalRelief: 2400,
        },
        deductions: [], // TODO: Implement deductions from database
        paymentMethod: 'bank_transfer' as const,
        personalRelief: 2400,
      },
    }));

    return res.status(200).json({
      status: 'success',
      data: payrollEmployees,
    });
  } catch (error) {
    console.error('Get payroll employees error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching payroll employees',
    });
  }
};

/**
 * Get payroll records with filters
 * @route GET /api/payroll/records
 */
export const getPayrollRecords = async (req: Request, res: Response) => {
  try {
    const { periodId, employeeId, department, branch, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const whereClause: any = { tenantId: req.tenantId };
    
    if (periodId) whereClause.payrollPeriodId = periodId;
    if (employeeId) whereClause.employeeId = employeeId;
    if (status) whereClause.status = status;
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Handle department and branch filters through employee relation
    const includeClause: any = {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      payrollItems: true,
      payrollPeriod: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          payDate: true,
        },
      },
      payStub: {
        select: {
          id: true,
          stubNumber: true,
          status: true,
          generatedAt: true,
        },
      },
    };

    // Add department filter if specified
    if (department) {
      includeClause.employee.where = { department: { name: department } };
    }

    // Add branch filter if specified
    if (branch) {
      if (includeClause.employee.where) {
        includeClause.employee.where.branch = { name: branch };
      } else {
        includeClause.employee.where = { branch: { name: branch } };
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.payroll.count({
        where: whereClause,
      }),
    ]);

    // Filter by department/branch if specified (since Prisma doesn't support complex nested filters easily)
    let filteredPayrolls = payrolls;
    if (department) {
      filteredPayrolls = payrolls.filter((p: any) => p.employee?.department?.name === department);
    }
    if (branch) {
      filteredPayrolls = filteredPayrolls.filter((p: any) => p.employee?.branch?.name === branch);
    }

    return res.status(200).json({
      status: 'success',
      data: filteredPayrolls,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get payroll records error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching payroll records',
    });
  }
};

/**
 * Get payroll record by ID
 * @route GET /api/payroll/records/:id
 */
export const getPayrollRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const payroll = await prisma.payroll.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payrollItems: true,
        payrollPeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            payDate: true,
          },
        },
        payStub: {
          select: {
            id: true,
            stubNumber: true,
            status: true,
            generatedAt: true,
          },
        },
      },
    });

    if (!payroll) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll record not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: payroll,
    });
  } catch (error) {
    console.error('Get payroll record by ID error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching payroll record',
    });
  }
};

/**
 * Approve payroll records
 * @route POST /api/payroll/records/approve
 */
export const approvePayrollRecords = async (req: Request, res: Response) => {
  try {
    const { recordIds, approverId } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Record IDs are required',
      });
    }

    if (!approverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Approver ID is required',
      });
    }

    // Update payroll records status to approved
    // Note: This assumes there's a status field in the payroll table
    // If not, you might need to add it to the schema
    const updatedPayrolls = await prisma.payroll.updateMany({
      where: {
        id: { in: recordIds },
        tenantId: req.tenantId,
      },
      data: {
        status: 'APPROVED',
        updatedAt: new Date(),
      },
    });

    // For now, return the count of updated records
    return res.status(200).json({
      status: 'success',
      message: `${updatedPayrolls.count} payroll records approved successfully`,
      data: {
        approvedCount: updatedPayrolls.count,
        approverId,
        approvedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Approve payroll records error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while approving payroll records',
    });
  }
};

/**
 * Delete a payroll period
 * @route DELETE /api/payroll/periods/:id
 */
export const deletePayrollPeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Delete payroll period and related payrolls/paystubs
    await prisma.payroll.deleteMany({ where: { payrollPeriodId: id, tenantId: req.tenantId } });
    await prisma.payStub.deleteMany({ where: { payrollPeriodId: id, tenantId: req.tenantId } });
    const deleted = await prisma.payrollPeriod.delete({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Payroll period deleted', data: deleted });
  } catch (error) {
    console.error('Delete payroll period error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while deleting payroll period' });
  }
};

/**
 * Calculate payroll (preview, simulation)
 * @route POST /api/payroll/calculate
 */
export const calculatePayroll = async (req: Request, res: Response) => {
  try {
    const { employeeId, payrollPeriodId, basicSalary, allowances = [], overtime } = req.body;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    if (!employeeId || !payrollPeriodId || basicSalary === undefined) {
      return res.status(400).json({ status: 'error', message: 'Employee ID, payroll period ID, and basic salary are required' });
    }
    // Simulate payroll calculation
    const calculation = await import('../services/payrollCalculation.service').then(m => m.calculatePayroll({ employeeId, payrollPeriodId, basicSalary, allowances, overtime, tenantId: req.tenantId }));
    return res.status(200).json({ status: 'success', data: calculation });
  } catch (error) {
    console.error('Calculate payroll error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while calculating payroll' });
  }
};

/**
 * Approve time entries
 * @route POST /api/payroll/time-entries/approve
 */
export const approveTimeEntries = async (req: Request, res: Response) => {
  try {
    const { timeEntryIds, approverId } = req.body;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    if (!timeEntryIds || !Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Time entry IDs are required' });
    }
    // Mock approval logic
    return res.status(200).json({ status: 'success', message: `${timeEntryIds.length} time entries approved`, data: { approvedCount: timeEntryIds.length, approverId, approvedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Approve time entries error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while approving time entries' });
  }
};

/**
 * Download pay stub PDF
 * @route GET /api/payroll/pay-stubs/:id/download
 */
export const downloadPayStub = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Mock PDF download response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=paystub_${id}.pdf`);
    res.send(Buffer.from('%PDF-1.4\n%Mock PDF for pay stub\n', 'utf-8'));
  } catch (error) {
    console.error('Download pay stub error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while downloading pay stub' });
  }
};

/**
 * Download payroll report PDF
 * @route GET /api/payroll/reports/:id/download
 */
export const downloadPayrollReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Mock PDF download response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payroll_report_${id}.pdf`);
    res.send(Buffer.from('%PDF-1.4\n%Mock PDF for payroll report\n', 'utf-8'));
  } catch (error) {
    console.error('Download payroll report error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while downloading payroll report' });
  }
};

/**
 * Delete all payroll records for a specific period
 * @route DELETE /api/payroll/period/:periodId/records
 */
export const deletePayrollRecordsByPeriod = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.params;
    
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    if (!periodId) {
      return res.status(400).json({ status: 'error', message: 'Period ID is required' });
    }

    // Verify the period exists and belongs to the tenant
    const period = await prisma.payrollPeriod.findFirst({
      where: { 
        id: periodId, 
        tenantId: req.tenantId 
      },
    });

    if (!period) {
      return res.status(404).json({ status: 'error', message: 'Payroll period not found' });
    }

    console.log(`Deleting payroll records for period ${periodId} in tenant ${req.tenantId}`);

    // Delete all payroll records for this period
    const deleteResult = await prisma.payroll.deleteMany({
      where: { 
        payrollPeriodId: periodId,
        employee: {
          tenantId: req.tenantId
        }
      },
    });

    console.log(`Deleted ${deleteResult.count} payroll records for period ${periodId}`);

    return res.status(200).json({ 
      status: 'success', 
      message: `Successfully deleted ${deleteResult.count} payroll records`,
      data: { deleted: deleteResult.count }
    });

  } catch (error) {
    console.error('Delete payroll records error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error while deleting payroll records' 
    });
  }
};
