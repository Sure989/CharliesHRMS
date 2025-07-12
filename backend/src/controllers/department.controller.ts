import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * Get all departments for a tenant
 * @route GET /api/departments
 */
export const getDepartments = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const departments = await prisma.department.findMany({
      where: { tenantId: req.tenantId },
      include: {
        branches: { select: { id: true, name: true } },
        employees: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: { departments },
    });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching departments',
    });
  }
};

/**
 * Get a single department by ID
 * @route GET /api/departments/:id
 */
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const department = await prisma.department.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        branches: { select: { id: true, name: true } },
        employees: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
    });

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { department },
    });
  } catch (error) {
    console.error('Get department by ID error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching department',
    });
  }
};

/**
 * Create a new department
 * @route POST /api/departments
 */
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, managerId } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Department name is required',
      });
    }

    // Check if department with same name already exists for this tenant
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name,
        tenantId: req.tenantId,
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        status: 'error',
        message: 'Department with this name already exists',
      });
    }

    const department = await prisma.department.create({
      data: {
        name,
        description,
        managerId,
        tenantId: req.tenantId,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Department created successfully',
      data: { department },
    });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating department',
    });
  }
};

/**
 * Update a department
 * @route PUT /api/departments/:id
 */
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, managerId, status } = req.body;
    
    console.log('Backend - updateDepartment called with:', {
      id,
      body: req.body,
      tenantId: req.tenantId
    });

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingDepartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }

    // Check if another department with same name exists (if name is being updated)
    if (name && name !== existingDepartment.name) {
      const duplicateDepartment = await prisma.department.findFirst({
        where: {
          name,
          tenantId: req.tenantId,
          id: { not: id },
        },
      });

      if (duplicateDepartment) {
        return res.status(409).json({
          status: 'error',
          message: 'Department with this name already exists',
        });
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(managerId !== undefined && { managerId }),
        ...(status && { status }),
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Department updated successfully',
      data: { department },
    });
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating department',
    });
  }
};

/**
 * Delete a department
 * @route DELETE /api/departments/:id
 */
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingDepartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found',
      });
    }

    await prisma.department.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting department',
    });
  }
};

/**
 * Get employees in a department
 * @route GET /api/departments/:id/employees
 */
export const getDepartmentEmployees = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    // Find employees in the department for this tenant
    const employees = await prisma.employee.findMany({
      where: {
        departmentId: id,
        tenantId: req.tenantId,
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } }
      }
    });
    return res.status(200).json({
      status: 'success',
      data: { employees },
    });
  } catch (error) {
    console.error('Get department employees error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching department employees',
    });
  }
};
