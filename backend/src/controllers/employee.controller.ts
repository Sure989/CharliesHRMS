/**
 * Get an employee by employeeNumber (business ID)
 * @route GET /api/employees/by-employee-id/:employeeId
 */
export const getEmployeeByEmployeeNumber = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    const employee = await prisma.employee.findFirst({
      where: {
        employeeNumber: employeeId,
        tenantId: req.tenantId,
      },
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }
    return res.status(200).json({
      status: 'success',
      data: { employee },
    });
  } catch (error) {
    console.error('Get employee by employeeNumber error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching employee',
    });
  }
};
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Get all employees for a tenant
 * @route GET /api/employees
 */
export const getEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const employees = await prisma.employee.findMany({
      where: { tenantId: req.tenantId },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: { employees },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching employees',
    });
  }
};

/**
 * Get a single employee by ID
 * @route GET /api/employees/:id
 */
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
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
    });

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { employee },
    });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching employee',
    });
  }
};

/**
 * Create a new employee
 * @route POST /api/employees
 */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      position,
      departmentId,
      branchId,
      salary,
      hireDate,
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!firstName || !lastName || !email || !position || !departmentId || !branchId || !hireDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Required fields: firstName, lastName, email, position, departmentId, branchId, hireDate',
      });
    }

    // Check if department exists
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId: req.tenantId,
      },
    });

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }

    // Check if branch exists
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        tenantId: req.tenantId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found',
      });
    }

    // Check if email already exists
    const existingEmail = await prisma.employee.findFirst({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already exists',
      });
    }

    // Generate next sequential employeeNumber (EMP###)
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { employeeNumber: 'desc' },
      select: { employeeNumber: true }
    });
    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeNumber) {
      const lastNum = parseInt(lastEmployee.employeeNumber.replace('EMP', ''), 10);
      nextNumber = lastNum + 1;
    }
    const nextEmployeeNumber = `EMP${String(nextNumber).padStart(3, '0')}`;

    const employee = await prisma.employee.create({
          data: {
            employeeNumber: nextEmployeeNumber,
            firstName,
            lastName,
            email,
            phone,
            address,
            position,
            departmentId,
            branchId,
            salary,
            hireDate: new Date(hireDate),
            status: 'ACTIVE',
            tenantId: req.tenantId,
            user: {
              create: {
                email,
                firstName,
                lastName,
                role: 'EMPLOYEE',
                tenantId: req.tenantId,
                passwordHash: ""
              }
            }
          },
          include: { user: true }
        });

    return res.status(201).json({
      status: 'success',
      data: { employee },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create employee',
    });
  }
};

/**
 * Update an employee
 * @route PUT /api/employees/:id
 */
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      employeeNumber,
      firstName,
      lastName,
      email,
      phone,
      address,
      position,
      departmentId,
      branchId,
      salary,
      hireDate,
      terminationDate,
      status,
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    // Check if department exists (if departmentId is being updated)
    if (departmentId && departmentId !== existingEmployee.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          tenantId: req.tenantId,
        },
      });

      if (!department) {
        return res.status(404).json({
          status: 'error',
          message: 'Department not found',
        });
      }
    }

    // Check if branch exists (if branchId is being updated)
    if (branchId && branchId !== existingEmployee.branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          tenantId: req.tenantId,
        },
      });

      if (!branch) {
        return res.status(404).json({
          status: 'error',
          message: 'Branch not found',
        });
      }
    }

    // Check if employee number already exists (if being updated)
    if (employeeNumber && employeeNumber !== existingEmployee.employeeNumber) {
      const duplicateEmployeeNumber = await prisma.employee.findFirst({
        where: {
          employeeNumber,
          id: { not: id },
        },
      });

      if (duplicateEmployeeNumber) {
        return res.status(409).json({
          status: 'error',
          message: 'Employee number already exists',
        });
      }
    }

    // Check if email already exists (if being updated)
    if (email && email !== existingEmployee.email) {
      const duplicateEmail = await prisma.employee.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        return res.status(409).json({
          status: 'error',
          message: 'Email already exists',
        });
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(employeeNumber && { employeeNumber }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(position && { position }),
        ...(departmentId && { departmentId }),
        ...(branchId && { branchId }),
        ...(salary !== undefined && { salary }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        ...(terminationDate !== undefined && { terminationDate: terminationDate ? new Date(terminationDate) : null }),
        ...(status && { status: typeof status === 'string' ? status.toUpperCase() : status }),
      },
      include: {
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
    });

    return res.status(200).json({
      status: 'success',
      message: 'Employee updated successfully',
      data: { employee },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating employee',
    });
  }
};

/**
 * Delete an employee
 * @route DELETE /api/employees/:id
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting employee',
    });
  }
};

/**
 * Get employee performance data
 * @route GET /api/employees/:id/performance
 */
export const getEmployeePerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    // Example: fetch performance reviews for the employee
    const reviews = await prisma.performanceReview.findMany({
      where: { employeeId: id, tenantId: req.tenantId },
    });
    return res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) {
    console.error('Get employee performance error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching performance data' });
  }
};

/**
 * Get employee leave history
 * @route GET /api/employees/:id/leave
 */
export const getEmployeeLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { employeeId: id, tenantId: req.tenantId },
    });
    return res.status(200).json({ status: 'success', data: { leaveRequests } });
  } catch (error) {
    console.error('Get employee leave error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching leave history' });
  }
};

/**
 * Get employee payroll history
 * @route GET /api/employees/:id/payroll
 */
export const getEmployeePayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    const payrolls = await prisma.payroll.findMany({
      where: { employeeId: id, tenantId: req.tenantId },
    });
    return res.status(200).json({ status: 'success', data: { payrolls } });
  } catch (error) {
    console.error('Get employee payroll error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching payroll history' });
  }
};

/**
 * Import employees from CSV or Excel file
 * @route POST /api/employees/import
 */
export const importEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    const file = req.file;
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    
    let employeeData: any[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    let successful = 0;
    let failed = 0;

    try {
      if (fileExtension === 'csv') {
        // Parse CSV file
        const csvData = file.buffer.toString('utf-8');
        const lines = csvData.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          return res.status(400).json({
            status: 'error',
            message: 'CSV file must contain at least a header row and one data row',
          });
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length === headers.length) {
            const employeeRow: any = {};
            headers.forEach((header, index) => {
              employeeRow[header] = values[index];
            });
            employeeData.push({ ...employeeRow, rowNumber: i + 1 });
          }
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
           // XLSX import and processing removed due to package removal for security reasons
           // If you need to support Excel files, consider using a different, secure library or only allow CSV uploads.
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Unsupported file format. Please use CSV or Excel files.',
        });
      }

      // Process each employee record
      for (const employee of employeeData) {
        try {
          // Validate required fields
          if (!employee.employeeId || !employee.firstName || !employee.lastName || !employee.email) {
            errors.push({
              row: employee.rowNumber,
              error: 'Missing required fields (employeeId, firstName, lastName, email)'
            });
            failed++;
            continue;
          }

          // Check if employee already exists
          const existingEmployee = await prisma.employee.findFirst({
            where: {
              OR: [
                { employeeNumber: employee.employeeId, tenantId: req.tenantId },
                { email: employee.email, tenantId: req.tenantId }
              ]
            }
          });

          if (existingEmployee) {
            errors.push({
              row: employee.rowNumber,
              error: `Employee with ID ${employee.employeeId} or email ${employee.email} already exists`
            });
            failed++;
            continue;
          }

          // Find or create department
          let departmentId = null;
          if (employee.department) {
            let department = await prisma.department.findFirst({
              where: { name: employee.department, tenantId: req.tenantId }
            });

            if (!department) {
              department = await prisma.department.create({
                data: {
                  name: employee.department,
                  tenantId: req.tenantId,
                  description: `Auto-created during employee import`,
                }
              });
            }
            departmentId = department.id;
          }

          // If no department specified, create/get default department
          if (!departmentId) {
            let defaultDept = await prisma.department.findFirst({
              where: { name: 'General', tenantId: req.tenantId }
            });
            if (!defaultDept) {
              defaultDept = await prisma.department.create({
                data: {
                  name: 'General',
                  description: 'Default department for imported employees',
                  tenantId: req.tenantId,
                }
              });
            }
            departmentId = defaultDept.id;
          }

          // Find or create branch
          let branchId = null;
          if (employee.branch) {
            let branch = await prisma.branch.findFirst({
              where: { name: employee.branch, tenantId: req.tenantId }
            });

            if (!branch) {
              // Create branch with default department if not specified
              let defaultDepartmentId = departmentId;
              if (!defaultDepartmentId) {
                // Get or create a default department
                let defaultDept = await prisma.department.findFirst({
                  where: { name: 'General', tenantId: req.tenantId }
                });
                if (!defaultDept) {
                  defaultDept = await prisma.department.create({
                    data: {
                      name: 'General',
                      description: 'Default department for imported employees',
                      tenantId: req.tenantId,
                    }
                  });
                }
                defaultDepartmentId = defaultDept.id;
              }

              branch = await prisma.branch.create({
                data: {
                  name: employee.branch,
                  address: `Auto-created during employee import`,
                  departmentId: defaultDepartmentId,
                  tenantId: req.tenantId,
                }
              });
            }
            branchId = branch.id;
          }

          // Create employee record
          await prisma.employee.create({
            data: {
              employeeNumber: employee.employeeId,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              phone: employee.phone || null,
              position: employee.position || null,
              hireDate: employee.hireDate ? new Date(employee.hireDate) : new Date(),
              status: 'active',
              tenantId: req.tenantId,
              departmentId: departmentId!, // We ensure this is always set above
              branchId: branchId || undefined,
            }
          });

          successful++;
        } catch (rowError) {
          console.error(`Error processing row ${employee.rowNumber}:`, rowError);
          errors.push({
            row: employee.rowNumber,
            error: `Failed to create employee: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
          });
          failed++;
        }
      }

      return res.status(200).json({
        status: 'success',
        data: {
          result: {
            success: successful,
            failed: failed,
            errors: errors
          }
        }
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to parse file. Please check the file format.',
      });
    }
  } catch (error) {
    console.error('Import employees error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while importing employees',
    });
  }
};

/**
 * Export employees to CSV
 * @route GET /api/employees/export
 */
export const exportEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const employees = await prisma.employee.findMany({
      where: { tenantId: req.tenantId },
      include: {
        department: true,
        branch: true,
      },
      orderBy: { employeeNumber: 'asc' },
    });

    // Create CSV content
    const headers = [
      'Employee ID',
      'First Name', 
      'Last Name',
      'Email',
      'Phone',
      'Position',
      'Department',
      'Branch',
      'Hire Date',
      'Status'
    ];

    const csvRows = [
      headers.join(','),
      ...employees.map((emp: any) => [
        emp.employeeNumber,
        emp.firstName,
        emp.lastName,
        emp.email,
        emp.phone || '',
        emp.position || '',
        emp.department?.name || '',
        emp.branch?.name || '',
        emp.hireDate?.toISOString().split('T')[0] || '',
        emp.status
      ].map(field => `"${field}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    return res.send(csvContent);

  } catch (error) {
    console.error('Export employees error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while exporting employees',
    });
  }
};
