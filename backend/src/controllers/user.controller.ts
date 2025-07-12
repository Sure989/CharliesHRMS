import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// List all users with filtering options
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add filtering, pagination, etc.
    const users = await prisma.user.findMany();
    res.json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

// Create new user
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add validation
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Update user request:', req.params.id, req.body); // DEBUG
    // Remove department and branch fields if present
    const { department, branch, ...updateData } = req.body;
    // Update user fields
    const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData });

    // Update related employee record if department or branch is present
    if (department || branch) {
      // Find employee record for this user
      const employee = await prisma.employee.findFirst({ where: { email: user.email } });
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

    res.json({ status: 'success', data: user });
  } catch (error) {
    console.error('Update user error:', error); // DEBUG
    next(error);
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.body.status === 'string' ? req.body.status.toUpperCase() : 'ACTIVE';
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
    res.json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

// Update user permissions (not supported by schema, return error)
export const updateUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ status: 'error', message: 'User permissions field not implemented in schema.' });
};

// Change user password (update passwordHash)
export const changeUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: hashedPassword } });
    res.json({ status: 'success', message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Example: count by role and status
    const stats = await prisma.user.groupBy({
      by: ['role', 'status'],
      _count: { id: true },
    });
    res.json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
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
    const permissions = [
      'user_management',
      'system_admin',
      'reports',
      'workflow_management',
      'salary_advances',
      'leave_management',
      'employee_management',
      'performance_management',
      'branch_management',
      'leave_approval',
      'salary_advance_approval',
      'staff_scheduling',
      'profile_view',
      'leave_request',
      'salary_advance_request',
      'staff_coordination'
    ];
    res.json({ status: 'success', data: permissions });
  } catch (error) {
    next(error);
  }
};
