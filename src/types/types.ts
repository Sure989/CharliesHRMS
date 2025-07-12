// Import the new Branch and Department types
export * from './branch';
export * from './department';

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  fte: number;
}

export interface Project {
  id: number;
  name: string;
  endDate: Date;
}

export interface Allocation {
  projectId: number;
  projectName: string;
  allocation: number;
  endDate: Date;
}

export interface TeamMemberAllocation extends TeamMember {
  allocations: Allocation[];
  availableFte: number;
}

export interface PlannedRole {
  id: number;
  role: string;
  count: number; // Added count property
  fte: number;
  startDate: Date;
  endDate: Date;
  durationWeeks: number; // Added durationWeeks property
  status: string; // Added status property
  project: string;
}

export interface Role {
  id: number;
  name: string;
  color?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'HR_MANAGER' | 'OPERATIONS_MANAGER' | 'EMPLOYEE';
  employeeId?: string; // Made optional
  branchId?: string; // Only for employees working at specific venues (optional)
  departmentId?: string; // Made optional for admin users who don't belong to a department
  profilePicture?: string;
  phone?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'suspended';
  position?: string;
  lastLogin?: string;
  permissions?: string[];
  createdBy?: string; // Track who added this employee
  createdDate?: string; // Track when employee was added
  managedBy?: string; // Track which operations manager manages this employee
  
  // Computed fields for backward compatibility and display
  branch?: string; // Computed from branchId for display
  department?: string; // Computed from departmentId for display
}

// Permission definitions for role-based access control
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'employee_management' | 'team_management' | 'system_admin' | 'reports' | 'workflow';
}

export const PERMISSIONS = {
  // Admin permissions (full access)
  ADMIN_FULL_ACCESS: 'admin:full_access',

  // HR Manager permissions
  HR_VIEW_EMPLOYEES: 'hr:view_employees',
  HR_MANAGE_EMPLOYEES: 'hr:manage_employees',
  HR_ADD_EMPLOYEE: 'hr:add_employee',
  HR_DELETE_EMPLOYEE: 'hr:delete_employee',
  HR_EDIT_EMPLOYEE_DETAILS: 'hr:edit_employee_details',
  HR_ASSIGN_EMPLOYEE_TO_BRANCH: 'hr:assign_employee_to_branch',
  HR_MANAGE_TEAM_MEMBERS: 'hr:manage_team_members',
  HR_VIEW_TEAM_DETAILS: 'hr:view_team_details',
  HR_EDIT_TEAM_MEMBER_STATUS: 'hr:edit_team_member_status',
  HR_VIEW_PAYROLL: 'hr:view_payroll',
  HR_MANAGE_PAYROLL: 'hr:manage_payroll',
  HR_VIEW_LEAVE: 'hr:view_leave',
  HR_MANAGE_LEAVE: 'hr:manage_leave',
  HR_VIEW_PERFORMANCE: 'hr:view_performance',
  HR_MANAGE_PERFORMANCE: 'hr:manage_performance',
  HR_MANAGE_PERFORMANCE_REVIEWS: 'hr:manage_performance_reviews',
  HR_VIEW_PERFORMANCE_REVIEWS: 'hr:view_performance_reviews',
  HR_CREATE_PERFORMANCE_REVIEW: 'hr:create_performance_review',
  HR_VIEW_TRAINING: 'hr:view_training',
  HR_MANAGE_TRAINING: 'hr:manage_training',
  HR_MANAGE_TRAINING_PROGRAMS: 'hr:manage_training_programs',
  HR_VIEW_TRAINING_PROGRAMS: 'hr:view_training_programs',
  HR_CREATE_TRAINING_PROGRAM: 'hr:create_training_program',
  HR_VIEW_DEPARTMENTS: 'hr:view_departments',
  HR_MANAGE_DEPARTMENTS: 'hr:manage_departments',
  HR_CREATE_DEPARTMENT: 'hr:create_department',
  HR_EDIT_DEPARTMENT: 'hr:edit_department',
  HR_DELETE_DEPARTMENT: 'hr:delete_department',
  HR_VIEW_BRANCHES: 'hr:view_branches',
  HR_MANAGE_BRANCHES: 'hr:manage_branches',
  HR_CREATE_BRANCH: 'hr:create_branch',
  HR_EDIT_BRANCH: 'hr:edit_branch',
  HR_DELETE_BRANCH: 'hr:delete_branch',
  HR_MANAGE_BRANCH_OPERATIONS: 'hr:manage_branch_operations',
  HR_VIEW_SALARY_ADVANCES: 'hr:view_salary_advances',
  HR_MANAGE_SALARY_ADVANCES: 'hr:manage_salary_advances',

  // Operations Manager permissions
  OPS_VIEW_EMPLOYEES: 'ops:view_employees',
  OPS_MANAGE_EMPLOYEES: 'ops:manage_employees',
  OPS_VIEW_LEAVE_APPROVALS: 'ops:view_leave_approvals',
  OPS_APPROVE_LEAVE: 'ops:approve_leave',
  OPS_VIEW_SALARY_ADVANCES: 'ops:view_salary_advances',
  OPS_APPROVE_SALARY_ADVANCES: 'ops:approve_salary_advances',
  OPS_VIEW_BRANCH_PERFORMANCE: 'ops:view_branch_performance',

  // Employee permissions
  EMPLOYEE_VIEW_PROFILE: 'employee:view_profile',
  EMPLOYEE_EDIT_PROFILE: 'employee:edit_profile',
  EMPLOYEE_VIEW_PAYSLIPS: 'employee:view_payslips',
  EMPLOYEE_REQUEST_LEAVE: 'employee:request_leave',
  EMPLOYEE_VIEW_LEAVE_STATUS: 'employee:view_leave_status',
  EMPLOYEE_REQUEST_SALARY_ADVANCE: 'employee:request_salary_advance',
  EMPLOYEE_VIEW_SALARY_ADVANCE_STATUS: 'employee:view_salary_advance_status',

  // New permissions from mock-data.ts that were not explicitly defined
  SCHEDULE_TEAM_MEMBERS: 'team:schedule_members',
  APPROVE_LEAVE_REQUESTS: 'leave:approve_requests',
  VIEW_LEAVE_REQUESTS: 'leave:view_requests',
  APPROVE_SALARY_ADVANCES: 'salary_advance:approve',
  VIEW_SALARY_ADVANCES: 'salary_advance:view',
  USER_MANAGEMENT: 'admin:user_management',
  SYSTEM_ADMIN: 'admin:system_admin',
  WORKFLOW_MANAGEMENT: 'admin:workflow_management',
  EDIT_PERFORMANCE_REVIEW: 'performance:edit_review',
  ENROLL_EMPLOYEES_TRAINING: 'training:enroll_employees',
  ISSUE_CERTIFICATES: 'training:issue_certificates',
  GENERATE_REPORTS: 'reports:generate',
  VIEW_ANALYTICS: 'reports:view_analytics',
  STAFF_COORDINATION: 'employee:staff_coordination', // From employee with id '13'
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: { [key: string]: string[] } = {
  ADMIN: [
    PERMISSIONS.ADMIN_FULL_ACCESS,
    PERMISSIONS.HR_ADD_EMPLOYEE,
    PERMISSIONS.HR_DELETE_EMPLOYEE,
    PERMISSIONS.HR_EDIT_EMPLOYEE_DETAILS,
    PERMISSIONS.HR_ASSIGN_EMPLOYEE_TO_BRANCH,
    PERMISSIONS.HR_MANAGE_TEAM_MEMBERS,
    PERMISSIONS.HR_VIEW_TEAM_DETAILS,
    PERMISSIONS.HR_EDIT_TEAM_MEMBER_STATUS,
    PERMISSIONS.HR_CREATE_DEPARTMENT,
    PERMISSIONS.HR_EDIT_DEPARTMENT,
    PERMISSIONS.HR_DELETE_DEPARTMENT,
    PERMISSIONS.HR_CREATE_BRANCH,
    PERMISSIONS.HR_EDIT_BRANCH,
    PERMISSIONS.HR_DELETE_BRANCH,
    PERMISSIONS.HR_MANAGE_BRANCH_OPERATIONS,
    PERMISSIONS.HR_MANAGE_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_VIEW_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_CREATE_PERFORMANCE_REVIEW,
    PERMISSIONS.EDIT_PERFORMANCE_REVIEW,
    PERMISSIONS.HR_MANAGE_TRAINING_PROGRAMS,
    PERMISSIONS.HR_VIEW_TRAINING_PROGRAMS,
    PERMISSIONS.HR_CREATE_TRAINING_PROGRAM,
    PERMISSIONS.ENROLL_EMPLOYEES_TRAINING,
    PERMISSIONS.ISSUE_CERTIFICATES,
    PERMISSIONS.SCHEDULE_TEAM_MEMBERS,
    PERMISSIONS.APPROVE_LEAVE_REQUESTS,
    PERMISSIONS.VIEW_LEAVE_REQUESTS,
    PERMISSIONS.APPROVE_SALARY_ADVANCES,
    PERMISSIONS.VIEW_SALARY_ADVANCES,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.WORKFLOW_MANAGEMENT,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.STAFF_COORDINATION,
  ], // Admins have all permissions
  HR_MANAGER: [
    PERMISSIONS.HR_VIEW_EMPLOYEES,
    PERMISSIONS.HR_MANAGE_EMPLOYEES,
    PERMISSIONS.HR_ADD_EMPLOYEE,
    PERMISSIONS.HR_DELETE_EMPLOYEE,
    PERMISSIONS.HR_EDIT_EMPLOYEE_DETAILS,
    PERMISSIONS.HR_ASSIGN_EMPLOYEE_TO_BRANCH,
    PERMISSIONS.HR_MANAGE_TEAM_MEMBERS,
    PERMISSIONS.HR_VIEW_TEAM_DETAILS,
    PERMISSIONS.HR_EDIT_TEAM_MEMBER_STATUS,
    PERMISSIONS.HR_VIEW_PAYROLL,
    PERMISSIONS.HR_MANAGE_PAYROLL,
    PERMISSIONS.HR_VIEW_LEAVE,
    PERMISSIONS.HR_MANAGE_LEAVE,
    PERMISSIONS.HR_VIEW_PERFORMANCE,
    PERMISSIONS.HR_MANAGE_PERFORMANCE,
    PERMISSIONS.HR_MANAGE_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_VIEW_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_CREATE_PERFORMANCE_REVIEW,
    PERMISSIONS.EDIT_PERFORMANCE_REVIEW,
    PERMISSIONS.HR_VIEW_TRAINING,
    PERMISSIONS.HR_MANAGE_TRAINING,
    PERMISSIONS.HR_MANAGE_TRAINING_PROGRAMS,
    PERMISSIONS.HR_VIEW_TRAINING_PROGRAMS,
    PERMISSIONS.HR_CREATE_TRAINING_PROGRAM,
    PERMISSIONS.ENROLL_EMPLOYEES_TRAINING,
    PERMISSIONS.ISSUE_CERTIFICATES,
    PERMISSIONS.HR_VIEW_DEPARTMENTS,
    PERMISSIONS.HR_MANAGE_DEPARTMENTS,
    PERMISSIONS.HR_CREATE_DEPARTMENT,
    PERMISSIONS.HR_EDIT_DEPARTMENT,
    PERMISSIONS.HR_DELETE_DEPARTMENT,
    PERMISSIONS.HR_VIEW_BRANCHES,
    PERMISSIONS.HR_MANAGE_BRANCHES,
    PERMISSIONS.HR_CREATE_BRANCH,
    PERMISSIONS.HR_EDIT_BRANCH,
    PERMISSIONS.HR_DELETE_BRANCH,
    PERMISSIONS.HR_MANAGE_BRANCH_OPERATIONS,
    PERMISSIONS.HR_VIEW_SALARY_ADVANCES,
    PERMISSIONS.HR_MANAGE_SALARY_ADVANCES,
    PERMISSIONS.APPROVE_LEAVE_REQUESTS,
    PERMISSIONS.VIEW_LEAVE_REQUESTS,
    PERMISSIONS.APPROVE_SALARY_ADVANCES,
    PERMISSIONS.VIEW_SALARY_ADVANCES,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    // HR Managers might also need some employee permissions to view their own data
    PERMISSIONS.EMPLOYEE_VIEW_PROFILE,
    PERMISSIONS.EMPLOYEE_VIEW_PAYSLIPS,
    PERMISSIONS.EMPLOYEE_REQUEST_LEAVE,
    PERMISSIONS.EMPLOYEE_VIEW_LEAVE_STATUS,
    PERMISSIONS.EMPLOYEE_REQUEST_SALARY_ADVANCE,
    PERMISSIONS.EMPLOYEE_VIEW_SALARY_ADVANCE_STATUS,
  ],
  OPERATIONS_MANAGER: [
    PERMISSIONS.OPS_VIEW_EMPLOYEES,
    PERMISSIONS.OPS_MANAGE_EMPLOYEES,
    PERMISSIONS.OPS_VIEW_LEAVE_APPROVALS,
    PERMISSIONS.OPS_APPROVE_LEAVE,
    PERMISSIONS.OPS_VIEW_SALARY_ADVANCES,
    PERMISSIONS.OPS_APPROVE_SALARY_ADVANCES,
    PERMISSIONS.OPS_VIEW_BRANCH_PERFORMANCE,
    PERMISSIONS.HR_MANAGE_TEAM_MEMBERS,
    PERMISSIONS.HR_VIEW_TEAM_DETAILS,
    PERMISSIONS.HR_EDIT_TEAM_MEMBER_STATUS,
    PERMISSIONS.SCHEDULE_TEAM_MEMBERS,
    PERMISSIONS.HR_MANAGE_BRANCH_OPERATIONS,
    PERMISSIONS.HR_VIEW_DEPARTMENTS,
    PERMISSIONS.HR_VIEW_BRANCHES,
    PERMISSIONS.APPROVE_LEAVE_REQUESTS,
    PERMISSIONS.VIEW_LEAVE_REQUESTS,
    PERMISSIONS.APPROVE_SALARY_ADVANCES,
    PERMISSIONS.VIEW_SALARY_ADVANCES,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    // Operations Managers might also need some employee permissions
    PERMISSIONS.EMPLOYEE_VIEW_PROFILE,
    PERMISSIONS.EMPLOYEE_VIEW_PAYSLIPS,
    PERMISSIONS.EMPLOYEE_REQUEST_LEAVE,
    PERMISSIONS.EMPLOYEE_VIEW_LEAVE_STATUS,
    PERMISSIONS.EMPLOYEE_REQUEST_SALARY_ADVANCE,
    PERMISSIONS.EMPLOYEE_VIEW_SALARY_ADVANCE_STATUS,
  ],
  EMPLOYEE: [
    PERMISSIONS.EMPLOYEE_VIEW_PROFILE,
    PERMISSIONS.EMPLOYEE_EDIT_PROFILE,
    PERMISSIONS.EMPLOYEE_VIEW_PAYSLIPS,
    PERMISSIONS.EMPLOYEE_REQUEST_LEAVE,
    PERMISSIONS.EMPLOYEE_VIEW_LEAVE_STATUS,
    PERMISSIONS.EMPLOYEE_REQUEST_SALARY_ADVANCE,
    PERMISSIONS.EMPLOYEE_VIEW_SALARY_ADVANCE_STATUS,
    PERMISSIONS.STAFF_COORDINATION, // Added for employee with id '13'
  ],
};

export interface WorkflowStep {
  id: string;
  step: string;
  actor: string;
  actorName: string;
  action: string;
  timestamp: string;
  comments?: string;
}

export interface PayrollDeduction {
  id: string;
  payrollPeriodId: string;
  deductionDate: string;
  deductedAmount: number;
  remainingBalance: number;
  payStubId: string;
  status: 'pending' | 'processed' | 'failed';
}

export interface AdvancePayrollIntegration {
  salaryAdvanceId: number | string;
  employeeId: string;
  isActive: boolean;
  monthlyDeductionAmount: number;
  remainingBalance: number;
  startDate: string;
  priority: number;
  createdDate: string;
  lastUpdated: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  branch: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  submissionDate: string;
  opsManagerId?: string;
  opsManagerName?: string;
  opsInitialDate?: string;
  opsInitialComments?: string;
  hrReviewerId?: string;
  hrReviewerName?: string;
  hrReviewDate?: string;
  hrDecision?: string;
  hrComments?: string;
  opsFinalDate?: string;
  opsFinalDecision?: string;
  opsFinalComments?: string;
  currentStep: string;
  workflowHistory: WorkflowStep[];
}

export interface SalaryAdvanceRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  branch: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: string;
  disbursedDate?: string;
  disbursedBy?: string;
  disbursementMethod: string;
  hrEligibilityDetails?: {
    currentSalary: number;
    existingAdvances: number;
    maxAllowableAdvance: number;
    employmentTenure: number;
    creditworthiness: string;
  };
  payrollIntegration: {
    payrollDeductionId: string;
    monthlyDeduction: number;
    repaymentMonths: number;
    startDeductionDate: string;
    estimatedCompletionDate: string;
    deductionPriority: number;
  };
  repaymentDetails: {
    originalAmount: number;
    totalDeducted: number;
    remainingBalance: number;
    repaymentMethod: string;
    deductionHistory: PayrollDeduction[];
    lastDeductionDate?: string;
  };
  opsManagerId?: string;
  opsManagerName?: string;
  opsInitialDate?: string;
  opsInitialComments?: string;
  hrReviewerId?: string;
  hrReviewerName?: string;
  hrReviewDate?: string;
  hrDecision?: string;
  hrComments?: string;
  opsFinalDate?: string;
  opsFinalDecision?: string;
  opsFinalComments?: string;
  currentStep: string;
  workflowHistory: WorkflowStep[];
}

export function getUserPermissions(role: string): string[] {
  if (role === 'ADMIN') {
    // Admins implicitly have all permissions, or we can explicitly list them all
    return Object.values(PERMISSIONS);
  }
  return ROLE_PERMISSIONS[role] || [];
}
