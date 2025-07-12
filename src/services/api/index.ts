// Centralized API service exports
export { authService } from './auth.service';
export { employeeService } from './employee.service';
export { payrollService } from './payroll.service';
export { leaveService } from './leave.service';
export { salaryAdvanceService } from './salaryAdvance.service';
export { analyticsService } from './analytics.service';
export { departmentService } from './department.service';
export { branchService } from './branch.service';
export { performanceReviewService } from './performanceReview.service';

// Re-export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './auth.service';

export type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeFilters,
} from './employee.service';

export type {
  PayrollFilters,
  CreatePayrollPeriodRequest,
  PayrollCalculationRequest,
} from './payroll.service';

export type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  CreateLeaveRequestRequest,
  LeaveRequestFilters,
  ApproveLeaveRequest,
  RejectLeaveRequest,
  LeaveCalendarEvent,
} from './leave.service';

export type {
  SalaryAdvanceRequest,
  RepaymentSchedule,
  CreateSalaryAdvanceRequest,
  SalaryAdvanceFilters,
  ApproveSalaryAdvanceRequest,
  RejectSalaryAdvanceRequest,
  SalaryAdvanceEligibility,
  SalaryAdvanceSettings,
  SalaryAdvanceStatistics,
} from './salaryAdvance.service';

export type {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from './department.service';

export type {
  CreateBranchRequest,
  UpdateBranchRequest,
} from './branch.service';

// Re-export API client types
export type {
  ApiResponse,
  PaginatedResponse,
} from '../apiClient';

// API service aggregator for easy imports
import { authService } from './auth.service';
import { employeeService } from './employee.service';
import { payrollService } from './payroll.service';
import { leaveService } from './leave.service';
import { salaryAdvanceService } from './salaryAdvance.service';
import { analyticsService } from './analytics.service';
import { departmentService } from './department.service';
import { branchService } from './branch.service';
import { apiClient } from '../apiClient';

export const api = {
  auth: authService,
  employees: employeeService,
  payroll: payrollService,
  leave: leaveService,
  salaryAdvances: salaryAdvanceService,
  analytics: analyticsService,
  departments: departmentService,
  branches: branchService,
  client: apiClient,
  
  // Health check for the entire API
  async healthCheck(): Promise<boolean> {
    return apiClient.healthCheck();
  },
  
  // Generic error handler
  handleError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
};

// Default export for convenience
export default api;
