import { Branch } from './branch';
import { Department } from './department';

// We need to re-export the types so they are available to other files that import from `types.ts`
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
  count: number;
  fte: number;
  startDate: Date;
  endDate: Date;
  durationWeeks: number;
  status: string;
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
  employeeId?: string;
  employeeNumber?: string;
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  profilePicture?: string;
  phone?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'terminated';
  position?: string;
  lastLogin?: string;
  permissions?: string[];
  createdBy?: string;
  createdDate?: string;
  managedBy?: string;
  
  // Computed fields for backward compatibility and display
  branch?: Branch;
  department?: Department;
}

// Permission definitions for role-based access control
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'employee_management' | 'team_management' | 'system_admin' | 'reports' | 'workflow';
}

export const PERMISSIONS = {
  // Admin permissions
  ADMIN_FULL_ACCESS: 'ADMIN:FULL_ACCESS',
  ADMIN_USER_MANAGEMENT: 'ADMIN:USER_MANAGEMENT',
  ADMIN_SYSTEM_ADMIN: 'ADMIN:SYSTEM_ADMIN',
  ADMIN_WORKFLOW_MANAGEMENT: 'ADMIN:WORKFLOW_MANAGEMENT',

  // Employee Management
  HR_VIEW_EMPLOYEES: 'HR:VIEW_EMPLOYEES',
  HR_MANAGE_EMPLOYEES: 'HR:MANAGE_EMPLOYEES',
  HR_ADD_EMPLOYEE: 'HR:ADD_EMPLOYEE',
  HR_DELETE_EMPLOYEE: 'HR:DELETE_EMPLOYEE',
  HR_EDIT_EMPLOYEE_DETAILS: 'HR:EDIT_EMPLOYEE_DETAILS',
  HR_ASSIGN_EMPLOYEE_TO_BRANCH: 'HR:ASSIGN_EMPLOYEE_TO_BRANCH',

  // Team Management
  HR_MANAGE_TEAM_MEMBERS: 'HR:MANAGE_TEAM_MEMBERS',
  HR_VIEW_TEAM_DETAILS: 'HR:VIEW_TEAM_DETAILS',
  HR_EDIT_TEAM_MEMBER_STATUS: 'HR:EDIT_TEAM_MEMBER_STATUS',
  TEAM_SCHEDULE_MEMBERS: 'TEAM:SCHEDULE_MEMBERS',

  // Payroll
  HR_VIEW_PAYROLL: 'HR:VIEW_PAYROLL',
  HR_MANAGE_PAYROLL: 'HR:MANAGE_PAYROLL',

  // Leave Management
  HR_VIEW_LEAVE: 'HR:VIEW_LEAVE',
  HR_MANAGE_LEAVE: 'HR:MANAGE_LEAVE',
  LEAVE_VIEW_REQUESTS: 'LEAVE:VIEW_REQUESTS',
  LEAVE_APPROVE_REQUESTS: 'LEAVE:APPROVE_REQUESTS',

  // Performance Management
  HR_VIEW_PERFORMANCE: 'HR:VIEW_PERFORMANCE',
  HR_MANAGE_PERFORMANCE: 'HR:MANAGE_PERFORMANCE',
  HR_VIEW_PERFORMANCE_REVIEWS: 'HR:VIEW_PERFORMANCE_REVIEWS',
  HR_MANAGE_PERFORMANCE_REVIEWS: 'HR:MANAGE_PERFORMANCE_REVIEWS',
  HR_CREATE_PERFORMANCE_REVIEW: 'HR:CREATE_PERFORMANCE_REVIEW',
  PERFORMANCE_EDIT_REVIEW: 'PERFORMANCE:EDIT_REVIEW',

  // Training Management
  HR_VIEW_TRAINING: 'HR:VIEW_TRAINING',
  HR_MANAGE_TRAINING: 'HR:MANAGE_TRAINING',
  HR_VIEW_TRAINING_PROGRAMS: 'HR:VIEW_TRAINING_PROGRAMS',
  HR_MANAGE_TRAINING_PROGRAMS: 'HR:MANAGE_TRAINING_PROGRAMS',
  HR_CREATE_TRAINING_PROGRAM: 'HR:CREATE_TRAINING_PROGRAM',
  TRAINING_ENROLL_EMPLOYEES: 'TRAINING:ENROLL_EMPLOYEES',
  TRAINING_ISSUE_CERTIFICATES: 'TRAINING:ISSUE_CERTIFICATES',

  // Department Management
  HR_VIEW_DEPARTMENTS: 'HR:VIEW_DEPARTMENTS',
  HR_MANAGE_DEPARTMENTS: 'HR:MANAGE_DEPARTMENTS',
  HR_CREATE_DEPARTMENT: 'HR:CREATE_DEPARTMENT',
  HR_EDIT_DEPARTMENT: 'HR:EDIT_DEPARTMENT',
  HR_DELETE_DEPARTMENT: 'HR:DELETE_DEPARTMENT',

  // Branch Management
  HR_VIEW_BRANCHES: 'HR:VIEW_BRANCHES',
  HR_MANAGE_BRANCHES: 'HR:MANAGE_BRANCHES',
  HR_CREATE_BRANCH: 'HR:CREATE_BRANCH',
  HR_EDIT_BRANCH: 'HR:EDIT_BRANCH',
  HR_DELETE_BRANCH: 'HR:DELETE_BRANCH',
  HR_MANAGE_BRANCH_OPERATIONS: 'HR:MANAGE_BRANCH_OPERATIONS',

  // Salary Advances
  HR_VIEW_SALARY_ADVANCES: 'HR:VIEW_SALARY_ADVANCES',
  HR_MANAGE_SALARY_ADVANCES: 'HR:MANAGE_SALARY_ADVANCES',
  SALARY_ADVANCE_VIEW: 'SALARY_ADVANCE:VIEW',
  SALARY_ADVANCE_APPROVE: 'SALARY_ADVANCE:APPROVE',

  // Operations Manager permissions
  OPS_VIEW_EMPLOYEES: 'OPS:VIEW_EMPLOYEES',
  OPS_MANAGE_EMPLOYEES: 'OPS:MANAGE_EMPLOYEES',
  OPS_VIEW_LEAVE_APPROVALS: 'OPS:VIEW_LEAVE_APPROVALS',
  OPS_APPROVE_LEAVE: 'OPS:APPROVE_LEAVE',
  OPS_VIEW_SALARY_ADVANCES: 'OPS:VIEW_SALARY_ADVANCES',
  OPS_APPROVE_SALARY_ADVANCES: 'OPS:APPROVE_SALARY_ADVANCES',
  OPS_VIEW_BRANCH_PERFORMANCE: 'OPS:VIEW_BRANCH_PERFORMANCE',

  // Employee permissions
  EMPLOYEE_VIEW_PROFILE: 'EMPLOYEE:VIEW_PROFILE',
  EMPLOYEE_EDIT_PROFILE: 'EMPLOYEE:EDIT_PROFILE',
  EMPLOYEE_VIEW_PAYSLIPS: 'EMPLOYEE:VIEW_PAYSLIPS',
  EMPLOYEE_REQUEST_LEAVE: 'EMPLOYEE:REQUEST_LEAVE',
  EMPLOYEE_VIEW_LEAVE_STATUS: 'EMPLOYEE:VIEW_LEAVE_STATUS',
  EMPLOYEE_REQUEST_SALARY_ADVANCE: 'EMPLOYEE:REQUEST_SALARY_ADVANCE',
  EMPLOYEE_VIEW_SALARY_ADVANCE_STATUS: 'EMPLOYEE:VIEW_SALARY_ADVANCE_STATUS',
  EMPLOYEE_STAFF_COORDINATION: 'EMPLOYEE:STAFF_COORDINATION',

  // Reports and Analytics
  REPORTS_GENERATE: 'REPORTS:GENERATE',
  REPORTS_VIEW_ANALYTICS: 'REPORTS:VIEW_ANALYTICS',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: { [key: string]: string[] } = {
  ADMIN: [
    PERMISSIONS.ADMIN_FULL_ACCESS,
    PERMISSIONS.ADMIN_USER_MANAGEMENT,
    PERMISSIONS.ADMIN_SYSTEM_ADMIN,
    PERMISSIONS.ADMIN_WORKFLOW_MANAGEMENT,
    PERMISSIONS.HR_VIEW_EMPLOYEES,
    PERMISSIONS.HR_MANAGE_EMPLOYEES,
    PERMISSIONS.HR_ADD_EMPLOYEE,
    PERMISSIONS.HR_DELETE_EMPLOYEE,
    PERMISSIONS.HR_EDIT_EMPLOYEE_DETAILS,
    PERMISSIONS.HR_ASSIGN_EMPLOYEE_TO_BRANCH,
    PERMISSIONS.HR_MANAGE_TEAM_MEMBERS,
    PERMISSIONS.HR_VIEW_TEAM_DETAILS,
    PERMISSIONS.HR_EDIT_TEAM_MEMBER_STATUS,
    PERMISSIONS.TEAM_SCHEDULE_MEMBERS,
    PERMISSIONS.HR_VIEW_PAYROLL,
    PERMISSIONS.HR_MANAGE_PAYROLL,
    PERMISSIONS.HR_VIEW_LEAVE,
    PERMISSIONS.HR_MANAGE_LEAVE,
    PERMISSIONS.LEAVE_VIEW_REQUESTS,
    PERMISSIONS.LEAVE_APPROVE_REQUESTS,
    PERMISSIONS.HR_VIEW_PERFORMANCE,
    PERMISSIONS.HR_MANAGE_PERFORMANCE,
    PERMISSIONS.HR_VIEW_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_MANAGE_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_CREATE_PERFORMANCE_REVIEW,
    PERMISSIONS.PERFORMANCE_EDIT_REVIEW,
    PERMISSIONS.HR_VIEW_TRAINING,
    PERMISSIONS.HR_MANAGE_TRAINING,
    PERMISSIONS.HR_VIEW_TRAINING_PROGRAMS,
    PERMISSIONS.HR_MANAGE_TRAINING_PROGRAMS,
    PERMISSIONS.HR_CREATE_TRAINING_PROGRAM,
    PERMISSIONS.TRAINING_ENROLL_EMPLOYEES,
    PERMISSIONS.TRAINING_ISSUE_CERTIFICATES,
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
    PERMISSIONS.SALARY_ADVANCE_VIEW,
    PERMISSIONS.SALARY_ADVANCE_APPROVE,
    PERMISSIONS.OPS_VIEW_EMPLOYEES,
    PERMISSIONS.OPS_MANAGE_EMPLOYEES,
    PERMISSIONS.OPS_VIEW_LEAVE_APPROVALS,
    PERMISSIONS.OPS_APPROVE_LEAVE,
    PERMISSIONS.OPS_VIEW_SALARY_ADVANCES,
    PERMISSIONS.OPS_APPROVE_SALARY_ADVANCES,
    PERMISSIONS.OPS_VIEW_BRANCH_PERFORMANCE,
    PERMISSIONS.EMPLOYEE_VIEW_PROFILE,
    PERMISSIONS.EMPLOYEE_EDIT_PROFILE,
    PERMISSIONS.EMPLOYEE_VIEW_PAYSLIPS,
    PERMISSIONS.EMPLOYEE_REQUEST_LEAVE,
    PERMISSIONS.EMPLOYEE_VIEW_LEAVE_STATUS,
    PERMISSIONS.EMPLOYEE_REQUEST_SALARY_ADVANCE,
    PERMISSIONS.EMPLOYEE_VIEW_SALARY_ADVANCE_STATUS,
    PERMISSIONS.EMPLOYEE_STAFF_COORDINATION,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_VIEW_ANALYTICS,
  ],
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
    PERMISSIONS.LEAVE_VIEW_REQUESTS,
    PERMISSIONS.LEAVE_APPROVE_REQUESTS,
    PERMISSIONS.HR_VIEW_PERFORMANCE,
    PERMISSIONS.HR_MANAGE_PERFORMANCE,
    PERMISSIONS.HR_VIEW_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_MANAGE_PERFORMANCE_REVIEWS,
    PERMISSIONS.HR_CREATE_PERFORMANCE_REVIEW,
    PERMISSIONS.PERFORMANCE_EDIT_REVIEW,
    PERMISSIONS.HR_VIEW_TRAINING,
    PERMISSIONS.HR_MANAGE_TRAINING,
    PERMISSIONS.HR_VIEW_TRAINING_PROGRAMS,
    PERMISSIONS.HR_MANAGE_TRAINING_PROGRAMS,
    PERMISSIONS.HR_CREATE_TRAINING_PROGRAM,
    PERMISSIONS.TRAINING_ENROLL_EMPLOYEES,
    PERMISSIONS.TRAINING_ISSUE_CERTIFICATES,
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
    PERMISSIONS.SALARY_ADVANCE_VIEW,
    PERMISSIONS.SALARY_ADVANCE_APPROVE,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_VIEW_ANALYTICS,
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
    PERMISSIONS.TEAM_SCHEDULE_MEMBERS,
    PERMISSIONS.HR_MANAGE_BRANCH_OPERATIONS,
    PERMISSIONS.HR_VIEW_DEPARTMENTS,
    PERMISSIONS.HR_VIEW_BRANCHES,
    PERMISSIONS.LEAVE_VIEW_REQUESTS,
    PERMISSIONS.LEAVE_APPROVE_REQUESTS,
    PERMISSIONS.SALARY_ADVANCE_VIEW,
    PERMISSIONS.SALARY_ADVANCE_APPROVE,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_VIEW_ANALYTICS,
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
  deducedAmount: number;
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
  managerId?: string;
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

export interface Training {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  capacity?: number;
  instructor?: string;
  venue?: string;
  requirements?: string[];
  certification?: boolean;
  cost?: number;
  category?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  enrollments: TrainingEnrollment[];
  enrolled: number;
}

export interface TrainingEnrollment {
  id: string;
  trainingId: string;
  employeeId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'withdrawn';
  progress?: number;
  score?: number;
  certificateIssued?: boolean;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
  employeeName: string;
  employeeEmail: string;
  position?: string;
  department?: string;
  branch?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    department?: { name: string };
    branch?: { name: string };
  };
}

export function getUserPermissions(role: string): string[] {
  if (role === 'ADMIN') {
    return Object.values(PERMISSIONS);
  }
  return ROLE_PERMISSIONS[role] || [];
}