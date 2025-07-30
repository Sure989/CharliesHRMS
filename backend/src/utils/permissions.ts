export const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_EDIT_PERMISSIONS: 'user:edit_permissions',
  USER_EDIT_ROLE: 'user:edit_role',

  // Role Management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  // System Administration
  SYSTEM_MANAGE_SETTINGS: 'system:manage_settings',
  SYSTEM_VIEW_LOGS: 'system:view_logs',

  // Reporting
  REPORTS_VIEW_ALL: 'reports:view_all',
  REPORTS_CREATE: 'reports:create',

  // Workflow Management
  WORKFLOW_MANAGE: 'workflow:manage',

  // Salary Advance
  SALARY_ADVANCE_MANAGE: 'salary_advance:manage',
  SALARY_ADVANCE_APPROVE: 'salary_advance:approve',
  SALARY_ADVANCE_REQUEST: 'salary_advance:request',

  // Leave Management
  LEAVE_MANAGE: 'leave:manage',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_REQUEST: 'leave:request',

  // Employee Management
  EMPLOYEE_MANAGE: 'employee:manage',

  // Performance Management
  PERFORMANCE_MANAGE: 'performance:manage',

  // Branch Management
  BRANCH_MANAGE: 'branch:manage',

  // Staff Management
  STAFF_SCHEDULE: 'staff:schedule',
  STAFF_COORDINATE: 'staff:coordinate',

  // Profile Management
  PROFILE_VIEW: 'profile:view',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
