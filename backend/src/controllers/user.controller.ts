import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';


// List all users with filtering options
export const getUsers = async (req: Request, res: Response) => {
  try {
    // TODO: Add filtering, pagination, etc.
    const users = await prisma.user.findMany();
    res.json({ status: 'success', data: users });
  } catch {
    // ...handle error if needed...
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

    // Automatically sync permissions with role
    // Import ROLE_PERMISSIONS from frontend/types/types.ts or duplicate mapping here
    const ROLE_PERMISSIONS = {
      ADMIN: [
        'admin:full_access', 'hr:add_employee', 'hr:delete_employee', 'hr:edit_employee_details', 'hr:assign_employee_to_branch',
        'hr:manage_team_members', 'hr:view_team_details', 'hr:edit_team_member_status', 'hr:create_department', 'hr:edit_department',
        'hr:delete_department', 'hr:create_branch', 'hr:edit_branch', 'hr:delete_branch', 'hr:manage_branch_operations',
        'hr:manage_performance_reviews', 'hr:view_performance_reviews', 'hr:create_performance_review', 'performance:edit_review',
        'hr:manage_training_programs', 'hr:view_training_programs', 'hr:create_training_program', 'training:enroll_employees',
        'training:issue_certificates', 'team:schedule_members', 'leave:approve_requests', 'leave:view_requests',
        'salary_advance:approve', 'salary_advance:view', 'admin:user_management', 'admin:system_admin', 'admin:workflow_management',
        'reports:generate', 'reports:view_analytics', 'employee:staff_coordination'
      ],
      HR_MANAGER: [
        'hr:manage_departments', 'hr:view_employees', 'hr:manage_employees', 'hr:add_employee', 'hr:delete_employee',
        'hr:edit_employee_details', 'hr:assign_employee_to_branch', 'hr:manage_team_members', 'hr:view_team_details',
        'hr:edit_team_member_status', 'hr:view_payroll', 'hr:manage_payroll', 'hr:view_leave', 'hr:manage_leave',
        'hr:view_performance', 'hr:manage_performance', 'hr:manage_performance_reviews', 'hr:view_performance_reviews',
        'hr:create_performance_review', 'performance:edit_review', 'hr:view_training', 'hr:manage_training',
        'hr:manage_training_programs', 'hr:view_training_programs', 'hr:create_training_program', 'training:enroll_employees',
        'training:issue_certificates', 'hr:view_departments', 'hr:create_department', 'hr:edit_department', 'hr:delete_department',
        'hr:view_branches', 'hr:manage_branches', 'hr:create_branch', 'hr:edit_branch', 'hr:delete_branch', 'hr:manage_branch_operations',
        'hr:view_salary_advances', 'hr:manage_salary_advances', 'leave:approve_requests', 'leave:view_requests',
        'salary_advance:approve', 'salary_advance:view', 'reports:generate', 'reports:view_analytics',
        'employee:view_profile', 'employee:view_payslips', 'employee:request_leave', 'employee:view_leave_status',
        'employee:request_salary_advance', 'employee:view_salary_advance_status'
      ],
      OPERATIONS_MANAGER: [
        'ops:view_employees', 'ops:manage_employees', 'ops:view_leave_approvals', 'ops:approve_leave', 'ops:view_salary_advances',
        'ops:approve_salary_advances', 'ops:view_branch_performance', 'hr:manage_team_members', 'hr:view_team_details',
        'hr:edit_team_member_status', 'team:schedule_members', 'hr:manage_branch_operations', 'hr:view_departments',
        'hr:view_branches', 'leave:approve_requests', 'leave:view_requests', 'salary_advance:approve', 'salary_advance:view',
        'reports:generate', 'reports:view_analytics', 'employee:view_profile', 'employee:view_payslips', 'employee:request_leave',
        'employee:view_leave_status', 'employee:request_salary_advance', 'employee:view_salary_advance_status'
      ],
      EMPLOYEE: [
        'employee:view_profile', 'employee:edit_profile', 'employee:view_payslips', 'employee:request_leave', 'employee:view_leave_status',
        'employee:request_salary_advance', 'employee:view_salary_advance_status', 'employee:staff_coordination'
      ]
    };
    const permissions = ROLE_PERMISSIONS[role.toUpperCase()] || [];
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role, permissions },
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

    const [totalUsers, activeUsers, adminUsers, hrManagerUsers] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.user.count({ where: { tenantId, role: 'ADMIN' } }),
      prisma.user.count({ where: { tenantId, role: 'HR_MANAGER' } })
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      adminUsers,
      hrManagerUsers
    };

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
