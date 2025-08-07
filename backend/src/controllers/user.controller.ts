import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { handleDemoMode, handleDemoModeWithPagination } from '../utils/demoModeHelper';
import { getMockDataByTenant } from '../utils/comprehensiveMockData';


// List all users with filtering options
export const getUsers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'default';
    
    const result = await handleDemoModeWithPagination(
      req,
      getMockDataByTenant.users(tenantId),
      async () => {
        const users = await prisma.user.findMany({
          where: { tenantId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        return {
          data: users,
          total: users.length,
          page,
          limit
        };
      }
    );
    
    res.json({ status: 'success', ...result });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const foundUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!foundUser) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.json({ status: 'success', data: foundUser });
  } catch {
    // ...handle error if needed...
  }
};

// Get current user profile with branch info
export const getCurrentUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId || !req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        employee: {
          include: {
            branch: true,
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', data: user });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Create new user
export const createUser = async (req: Request, res: Response) => {
  try {
    // TODO: Add validation
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json({ status: 'success', data: user });
  } catch {
    // ...handle error if needed...
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    console.log('Update user request:', req.params.id, req.body); // DEBUG
    // Remove department and branch fields if present
    const { department, branch, ...updateData } = req.body;
    // Update user fields
    const updatedUser = await prisma.user.update({ where: { id: req.params.id }, data: updateData });

    // Update related employee record if department or branch is present
    if (department || branch) {
      // Find employee record for this user
      const employee = await prisma.employee.findFirst({ where: { email: updatedUser.email } });
      if (employee) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            ...(department ? { departmentId: department } : {}),
            ...(branch ? { branchId: branch } : {})
          }
        });
      }
    }

    res.json({ status: 'success', data: updatedUser });
  } catch {
    // ...handle error if needed...
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: 'User deleted' });
  } catch (error) {
    // ...handle error if needed...
  }
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const status = typeof req.body.status === 'string' ? req.body.status.toUpperCase() : 'ACTIVE';
    const updatedUser = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
    res.json({ status: 'success', data: { user: updatedUser } });
  } catch {
    // ...handle error if needed...
  }
};

import { ALL_PERMISSIONS } from '../utils/permissions';

// Update user permissions
export const updateUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ status: 'error', message: 'Permissions must be an array' });
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!existingUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { permissions },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    console.error('Update user permissions error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update user permissions' });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    if (!role) {
      return res.status(400).json({ status: 'error', message: 'Role is required' });
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!existingUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update user role' });
  }
};

// Change user password (update passwordHash)
export const changeUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: hashedPassword } });
    res.json({ status: 'success', message: 'Password updated' });
  } catch (error) {
    //
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }

    const stats = await handleDemoMode(
      req,
      {
        totalUsers: 4,
        activeUsers: 4,
        adminUsers: 1,
        hrManagerUsers: 1
      },
      async () => {
        const [totalUsers, activeUsers, adminUsers, hrManagerUsers] = await Promise.all([
          prisma.user.count({ where: { tenantId } }),
          prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
          prisma.user.count({ where: { tenantId, role: 'ADMIN' } }),
          prisma.user.count({ where: { tenantId, role: 'HR_MANAGER' } })
        ]);

        return {
          totalUsers,
          activeUsers,
          adminUsers,
          hrManagerUsers
        };
      }
    );

    res.json({ status: 'success', data: stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get user statistics' });
  }
};

// Get available roles and permissions
export const getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = [
      { 
        id: 'ADMIN', 
        name: 'Administrator', 
        description: 'Full system access and user management',
        permissions: [
          'user_management',
          'system_admin',
          'reports',
          'workflow_management',
          'salary_advances',
          'leave_management'
        ]
      },
      { 
        id: 'HR_MANAGER', 
        name: 'HR Manager', 
        description: 'Employee management and HR operations',
        permissions: [
          'employee_management',
          'leave_management',
          'salary_advances',
          'reports',
          'performance_management'
        ]
      },
      { 
        id: 'OPERATIONS_MANAGER', 
        name: 'Operations Manager', 
        description: 'Branch management and operational oversight',
        permissions: [
          'branch_management',
          'leave_approval',
          'salary_advance_approval',
          'staff_scheduling',
          'reports'
        ]
      },
      { 
        id: 'EMPLOYEE', 
        name: 'Employee', 
        description: 'Basic employee access and self-service',
        permissions: [
          'profile_view',
          'leave_request',
          'salary_advance_request'
        ]
      }
    ];
    res.json({ status: 'success', data: roles });
  } catch (error) {
    next(error);
  }
};

// Get available departments
export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    });
    res.json({ status: 'success', data: departments });
  } catch (error) {
    next(error);
  }
};

// Get available permissions
export const getPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ status: 'success', data: ALL_PERMISSIONS });
  } catch (error) {
    next(error);
  }
};
