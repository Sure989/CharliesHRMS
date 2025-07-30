import { User, PERMISSIONS, PermissionKey } from '@/types/types';

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user: User | null, permission: PermissionKey): boolean => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

/**
 * Check if a user can add employees (Admin or HR only)
 */
export const canAddEmployee = (user: User | null): boolean => {
if (!user) return false;
const role = user.role?.toUpperCase();
if (role === 'ADMIN' || role === 'HR_MANAGER') return true;
return hasPermission(user, PERMISSIONS.HR_ADD_EMPLOYEE);
};

/**
 * Check if a user can delete employees (Admin or HR only)
 */
export const canDeleteEmployee = (user: User | null): boolean => {
if (!user) return false;
const role = user.role?.toUpperCase();
if (role === 'ADMIN' || role === 'HR_MANAGER') return true;
return hasPermission(user, PERMISSIONS.HR_DELETE_EMPLOYEE);
};

/**
 * Check if a user can edit employee details (Admin or HR only)
 */
export const canEditEmployeeDetails = (user: User | null): boolean => {
if (!user) return false;
const role = user.role?.toUpperCase();
if (role === 'ADMIN' || role === 'HR_MANAGER') return true;
return hasPermission(user, PERMISSIONS.HR_EDIT_EMPLOYEE_DETAILS);
};

/**
 * Check if a user can assign employees to branches (Admin or HR only)
 */
export const canAssignEmployeeToBranch = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_ASSIGN_EMPLOYEE_TO_BRANCH);
};

/**
 * Check if a user can manage team members (Operations Manager)
 */
export const canManageTeamMembers = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_MANAGE_TEAM_MEMBERS);
};

/**
 * Check if a user can view team details (Operations Manager)
 */
export const canViewTeamDetails = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_VIEW_TEAM_DETAILS);
};

/**
 * Check if a user can edit team member status (Operations Manager)
 */
export const canEditTeamMemberStatus = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_EDIT_TEAM_MEMBER_STATUS);
};

/**
 * Get role-based permissions description
 */
export const getRolePermissionsDescription = (role: string): string => {
  const lowerRole = role.toLowerCase();
  switch (lowerRole) {
    case 'admin':
      return 'Full system access including adding, editing, and deleting employees across all branches.';
    case 'hr_manager':
      return 'Can add, edit, and delete employees. Can assign employees to branches and manage HR processes.';
    case 'operations_manager':
      return 'Can manage existing team members in their branch but cannot add new employees. Can approve leave requests and salary advances.';
    case 'employee':
      return 'Can view own profile, submit leave requests, and request salary advances.';
    default:
      return 'No specific permissions defined.';
  }
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const lowerRole = role.toLowerCase();
  switch (lowerRole) {
    case 'admin':
      return 'Administrator';
    case 'hr_manager':
      return 'HR Manager';
    case 'operations_manager':
      return 'Operations Manager';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
};

/**
 * Check if a user can manage departments (Admin or HR only)
 */
export const canManageDepartments = (user: User | null): boolean => {
  if (!user) return false;
  if (user.role && user.role.toUpperCase() === 'ADMIN') return true;
  return hasPermission(user, PERMISSIONS.HR_MANAGE_DEPARTMENTS);
};

/**
 * Check if a user can view departments
 */
export const canViewDepartments = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_VIEW_DEPARTMENTS) || canManageDepartments(user);
};

/**
 * Check if a user can manage branches (Admin or HR only)
 */
export const canManageBranches = (user: User | null): boolean => {
  if (!user) return false;
  if (user.role && user.role.toUpperCase() === 'ADMIN') return true;
  return hasPermission(user, PERMISSIONS.HR_MANAGE_BRANCHES);
};

/**
 * Check if a user can view branches
 */
export const canViewBranches = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_VIEW_BRANCHES) || canManageBranches(user);
};

/**
 * Check if a user can manage branch operations (Operations Manager)
 */
export const canManageBranchOperations = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_MANAGE_BRANCH_OPERATIONS);
};

/**
 * Check if user can perform action on specific employee
 */
export const canPerformActionOnEmployee = (
  currentUser: User | null,
  targetEmployee: User,
  action: 'edit' | 'delete' | 'manage'
): boolean => {
  if (!currentUser) return false;

  // Admin can do everything
  if (currentUser.role.toUpperCase() === 'ADMIN') return true;

  // HR can edit/delete employees they created or any employee
  if (currentUser.role.toUpperCase() === 'HR_MANAGER') {
    if (action === 'edit' || action === 'delete') {
      return hasPermission(currentUser, PERMISSIONS.HR_EDIT_EMPLOYEE_DETAILS) || 
             hasPermission(currentUser, PERMISSIONS.HR_DELETE_EMPLOYEE);
    }
  }

  // Operations manager can only manage employees in their branch
  if (currentUser.role.toUpperCase() === 'OPERATIONS_MANAGER') {
    if (action === 'manage' && targetEmployee.branchId === currentUser.branchId) {
      return hasPermission(currentUser, PERMISSIONS.HR_MANAGE_TEAM_MEMBERS);
    }
    // Operations managers cannot edit employee details or delete employees
    return false;
  }

  return false;
};

/**
 * Check if user can access specific branch data
 */
export const canAccessBranch = (user: User | null, branchId: string): boolean => {
  if (!user) return false;
  
  const upperRole = user.role.toUpperCase();
  
  // Admin and HR can access all branches
  if (upperRole === 'ADMIN' || upperRole === 'HR_MANAGER') return true;
  
  // Operations managers can only access their own branch
  if (upperRole === 'OPERATIONS_MANAGER') {
    return user.branchId === branchId;
  }
  
  // Employees can only access their own branch
  return user.branchId === branchId;
};

/**
 * Check if user can access specific department data
 */
export const canAccessDepartment = (user: User | null, departmentId: string): boolean => {
  if (!user) return false;
  
  const upperRole = user.role.toUpperCase();
  
  // Admin and HR can access all departments
  if (upperRole === 'ADMIN' || upperRole === 'HR_MANAGER') return true;
  
  // Others can only access their own department
  return user.departmentId === departmentId;
};

/**
 * Check if a user can manage performance reviews (Admin & HR only)
 */
export const canManagePerformanceReviews = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_MANAGE_PERFORMANCE_REVIEWS);
};

/**
 * Check if a user can view performance reviews
 */
export const canViewPerformanceReviews = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_VIEW_PERFORMANCE_REVIEWS) || canManagePerformanceReviews(user);
};

/**
 * Check if a user can create performance reviews
 */
export const canCreatePerformanceReview = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_CREATE_PERFORMANCE_REVIEW);
};

/**
 * Check if a user can manage training programs (Admin & HR only)
 */
export const canManageTrainingPrograms = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_MANAGE_TRAINING_PROGRAMS);
};

/**
 * Check if a user can view training programs
 */
export const canViewTrainingPrograms = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_VIEW_TRAINING_PROGRAMS) || canManageTrainingPrograms(user);
};

/**
 * Check if a user can create training programs
 */
export const canCreateTrainingProgram = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.HR_CREATE_TRAINING_PROGRAM);
};

/**
 * Check if a user can enroll employees in training
 */
export const canEnrollEmployeesTraining = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.ENROLL_EMPLOYEES_TRAINING);
};

/**
 * Check if a user can view leave requests
 */
export const canViewLeaveRequests = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.VIEW_LEAVE_REQUESTS);
};

/**
 * Check if a user can approve leave requests
 */
export const canApproveLeaveRequests = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.APPROVE_LEAVE_REQUESTS);
};

/**
 * Check if a user can view salary advances
 */
export const canViewSalaryAdvances = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.VIEW_SALARY_ADVANCES);
};

/**
 * Check if a user can approve salary advances
 */
export const canApproveSalaryAdvances = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.APPROVE_SALARY_ADVANCES);
};

/**
 * Check if a user can generate reports
 */
export const canGenerateReports = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.GENERATE_REPORTS);
};

/**
 * Check if a user can view analytics
 */
export const canViewAnalytics = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.VIEW_ANALYTICS);
};

/**
 * Check if a user can manage system administration
 */
export const canManageSystem = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.SYSTEM_ADMIN);
};

/**
 * Check if a user can manage workflows
 */
export const canManageWorkflows = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.WORKFLOW_MANAGEMENT);
};

/**
 * Check if a user can manage users
 */
export const canManageUsers = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.USER_MANAGEMENT);
};

/**
 * Check if a user has full admin access
 */
export const hasFullAdminAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.role.toUpperCase() === 'ADMIN' && 
         hasPermission(user, PERMISSIONS.SYSTEM_ADMIN) && 
         hasPermission(user, PERMISSIONS.USER_MANAGEMENT) &&
         hasPermission(user, PERMISSIONS.WORKFLOW_MANAGEMENT);
};
