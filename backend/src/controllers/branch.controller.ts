import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Get all branches for a tenant
 * @route GET /api/branches
 */
export const getBranches = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const branches = await prisma.branch.findMany({
      where: { tenantId: req.tenantId },
      include: {
        department: {
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
      data: { branches },
    });
  } catch (error) {
    console.error('Get branches error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching branches',
    });
  }
};

/**
 * Get a single branch by ID
 * @route GET /api/branches/:id
 */
export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const branch = await prisma.branch.findFirst({
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
      },
    });

    if (!branch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { branch },
    });
  } catch (error) {
    console.error('Get branch by ID error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching branch',
    });
  }
};

/**
 * Create a new branch
 * @route POST /api/branches
 */
export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, location, address, managerId, departmentId } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    if (!name || !departmentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Branch name and department ID are required',
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

    // Check if branch with same name already exists for this tenant
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name,
        tenantId: req.tenantId,
      },
    });

    if (existingBranch) {
      return res.status(409).json({
        status: 'error',
        message: 'Branch with this name already exists',
      });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        location,
        address,
        managerId,
        departmentId,
        tenantId: req.tenantId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Branch created successfully',
      data: { branch },
    });
  } catch (error) {
    console.error('Create branch error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating branch',
    });
  }
};

/**
 * Update a branch
 * @route PUT /api/branches/:id
 */
export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, address, managerId, departmentId, status } = req.body;
    
    console.log('Backend - updateBranch called with:', {
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

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found',
      });
    }

    // Check if department exists (if departmentId is being updated)
    if (departmentId && departmentId !== existingBranch.departmentId) {
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

    // Check if another branch with same name exists (if name is being updated)
    if (name && name !== existingBranch.name) {
      const duplicateBranch = await prisma.branch.findFirst({
        where: {
          name,
          tenantId: req.tenantId,
          id: { not: id },
        },
      });

      if (duplicateBranch) {
        return res.status(409).json({
          status: 'error',
          message: 'Branch with this name already exists',
        });
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location !== undefined && { location }),
        ...(address !== undefined && { address }),
        ...(managerId !== undefined && { managerId }),
        ...(departmentId && { departmentId }),
        ...(status && { status }),
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Branch updated successfully',
      data: { branch },
    });
  } catch (error) {
    console.error('Update branch error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating branch',
    });
  }
};

/**
 * Delete a branch
 * @route DELETE /api/branches/:id
 */
export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found',
      });
    }

    // Check if branch has employees
    const employeeCount = await prisma.employee.count({
      where: { branchId: id },
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete branch with existing employees',
      });
    }

    await prisma.branch.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Branch deleted successfully',
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting branch',
    });
  }
};

/**
 * Get employees in a branch
 * @route GET /api/branches/:id/employees
 */
export const getBranchEmployees = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[getBranchEmployees] branchId:', id, 'tenantId:', req.tenantId);
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }
    // Find employees in the branch for this tenant
    const employees = await prisma.employee.findMany({
      where: {
        branchId: id,
        tenantId: req.tenantId,
      },
    });
    console.log('[getBranchEmployees] found employees:', employees);
    return res.status(200).json({
      status: 'success',
      data: { employees },
    });
  } catch (error) {
    console.error('Get branch employees error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching branch employees',
    });
  }
};
