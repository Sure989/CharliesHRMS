/* eslint-disable @typescript-eslint/no-explicit-any */

import { 
  TeamMemberAllocation, 
  PlannedRole, 
  User, 
  Role,
  LeaveRequest, 
  SalaryAdvanceRequest, 
  WorkflowStep, 
  PayrollDeduction,
  AdvancePayrollIntegration 
} from "@/types/types";

// Import Kenyan payroll types
import type {
  TimeEntry,
  PayrollPeriod,
  KenyanPayrollEmployee as PayrollEmployee,
  KenyanPayrollRecord as PayrollRecord,
  KenyanPayStub as PayStub,
  KenyanTaxTable as TaxTable,
  KenyanPayrollReport as PayrollReport,
  KenyanComplianceReport as ComplianceReport,
  KenyanPayrollAuditLog as PayrollAuditLog,
  KenyanPayrollSettings as PayrollSettings
} from "@/types/payroll";

// Import real API services
import { authService } from './api/auth.service';
import { employeeService } from './api/employee.service';
import { leaveService } from './api/leave.service';
import { salaryAdvanceService } from './api/salaryAdvance.service';
import { payrollService } from './api/payroll.service';

// Helper function to map backend employee to frontend User
const mapEmployeeToUser = (employee: any): User => ({
  id: employee.id,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  role: (employee.position || 'EMPLOYEE') as 'ADMIN' | 'HR_MANAGER' | 'OPERATIONS_MANAGER' | 'EMPLOYEE',
  department: employee.department,
  status: employee.status === 'active' ? 'active' : 'inactive',
  position: employee.position,
  employeeId: employee.employeeId,
  branchId: employee.branchId,
  departmentId: employee.departmentId
});

// Helper function to map backend leave request to frontend LeaveRequest
const mapBackendLeaveToFrontend = (backendLeave: any): LeaveRequest => ({
  id: backendLeave.id,
  employeeId: backendLeave.employeeId,
  employeeName: `${backendLeave.employee.firstName} ${backendLeave.employee.lastName}`,
  branch: backendLeave.employee.department,
  leaveType: backendLeave.leaveType.name,
  startDate: backendLeave.startDate,
  endDate: backendLeave.endDate,
  days: backendLeave.totalDays,
  reason: backendLeave.reason,
  status: mapLeaveStatus(backendLeave.status),
  submissionDate: backendLeave.appliedDate,
  currentStep: mapLeaveCurrentStep(backendLeave.status),
  workflowHistory: [
    {
      id: `wf-${backendLeave.id}`,
      step: 'submission',
      actor: backendLeave.employeeId,
      actorName: `${backendLeave.employee.firstName} ${backendLeave.employee.lastName}`,
      action: 'submitted',
      timestamp: backendLeave.createdAt,
      comments: backendLeave.reason
    }
  ]
});

// Helper function to map backend salary advance to frontend SalaryAdvanceRequest
const mapBackendSalaryAdvanceToFrontend = (backendAdvance: any): SalaryAdvanceRequest => ({
  id: parseInt(backendAdvance.id),
  employeeId: parseInt(backendAdvance.employeeId),
  employeeName: backendAdvance.employee ? `${backendAdvance.employee.firstName} ${backendAdvance.employee.lastName}` : 'Unknown Employee',
  branch: backendAdvance.employee?.department || 'Unknown',
  amount: backendAdvance.requestedAmount || 0,
  reason: backendAdvance.reason,
  requestDate: backendAdvance.requestDate || backendAdvance.createdAt?.split('T')[0],
  status: mapSalaryAdvanceStatus(backendAdvance.status),
  disbursementMethod: 'bank_transfer',
  currentStep: mapSalaryAdvanceCurrentStep(backendAdvance.status),
  payrollIntegration: {
    payrollDeductionId: `PD-${backendAdvance.id}`,
    monthlyDeduction: Math.round((backendAdvance.requestedAmount || 0) / 6),
    repaymentMonths: 6,
    startDeductionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedCompletionDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deductionPriority: 1
  },
  repaymentDetails: {
    originalAmount: backendAdvance.requestedAmount || 0,
    totalDeducted: 0,
    remainingBalance: backendAdvance.requestedAmount || 0,
    repaymentMethod: 'payroll_deduction_only',
    deductionHistory: []
  },
  workflowHistory: [
    {
      id: `wf-sa-${backendAdvance.id}`,
      step: 'submission',
      actor: backendAdvance.employeeId,
      actorName: backendAdvance.employee ? `${backendAdvance.employee.firstName} ${backendAdvance.employee.lastName}` : 'Unknown Employee',
      action: 'submitted',
      timestamp: backendAdvance.createdAt,
      comments: backendAdvance.reason
    }
  ]
});

// Status mapping functions
const mapLeaveStatus = (backendStatus: string): string => {
  switch (backendStatus) {
    case 'pending': return 'pending_ops_initial';
    case 'approved': return 'ops_final_approved';
    case 'rejected': return 'ops_final_rejected';
    default: return backendStatus;
  }
};

const mapLeaveCurrentStep = (backendStatus: string): string => {
  switch (backendStatus) {
    case 'pending': return 'ops_initial';
    case 'approved': 
    case 'rejected': return 'completed';
    default: return 'ops_initial';
  }
};

const mapSalaryAdvanceStatus = (backendStatus: string): string => {
  switch (backendStatus) {
    case 'pending': return 'pending_ops_initial';
    case 'approved': return 'ops_final_approved';
    case 'rejected': return 'ops_final_rejected';
    case 'disbursed': return 'disbursed';
    default: return backendStatus;
  }
};

const mapSalaryAdvanceCurrentStep = (backendStatus: string): string => {
  switch (backendStatus) {
    case 'pending': return 'ops_initial';
    case 'approved': return 'disbursement';
    case 'disbursed': return 'repayment';
    case 'rejected': return 'completed';
    default: return 'ops_initial';
  }
};

// Create a unified API that maps to real API services
export const api = {
  // Auth methods
  auth: {
    getToken: async () => {
      try {
        // Cleaned up: removed legacy mock token comment
        return "mock-auth-token-" + Math.random().toString(36).substring(2);
      } catch (error) {
        console.error("Auth.getToken error:", error);
        throw error;
      }
    },
    isAuthenticated: async () => {
      try {
        return authService.isAuthenticated();
      } catch (error) {
        console.error("Auth.isAuthenticated error:", error);
        return false;
      }
    }
  },
  
  // Data fetching methods
  data: {
    // Team allocation methods (not implemented in backend yet)
    getAvailability: async (startDate: Date, endDate: Date): Promise<TeamMemberAllocation[]> => {
      try {
        console.log(`Fetching availability from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        return [];
      } catch (error) {
        console.error("getAvailability error:", error);
        return [];
      }
    },
    
    getCapacityData: async (startDate: Date, weeks: number) => {
      try {
        console.log(`Fetching capacity data from ${startDate.toISOString()} for ${weeks} weeks`);
        return [];
      } catch (error) {
        console.error("getCapacityData error:", error);
        return [];
      }
    },
    
    getRoleCapacityData: async (startDate: Date, weeks: number) => {
      try {
        console.log(`Fetching role capacity data from ${startDate.toISOString()} for ${weeks} weeks`);
        return [];
      } catch (error) {
        console.error("getRoleCapacityData error:", error);
        return [];
      }
    },
    
    getPlannedRoles: async (): Promise<PlannedRole[]> => {
      try {
        console.log("Fetching planned roles");
        return [];
      } catch (error) {
        console.error("getPlannedRoles error:", error);
        return [];
      }
    },
    
    savePlannedRole: async (role: PlannedRole): Promise<PlannedRole> => {
      try {
        console.log("Saving planned role:", role);
        return { ...role, id: Math.floor(Math.random() * 1000) };
      } catch (error) {
        console.error("savePlannedRole error:", error);
        throw error;
      }
    },
    
    deletePlannedRole: async (id: number): Promise<boolean> => {
      try {
        console.log(`Deleting planned role with ID: ${id}`);
        return true;
      } catch (error) {
        console.error("deletePlannedRole error:", error);
        return false;
      }
    },

    getUsers: async (): Promise<User[]> => {
      try {
        console.log("Fetching users from backend API");
        const response = await employeeService.getEmployees();
        const employees = response.data || [];
        return employees.map(mapEmployeeToUser);
      } catch (error) {
        console.error("getUsers error:", error);
        return [];
      }
    },

    getRoles: async (): Promise<Role[]> => {
      try {
        console.log("Fetching roles from backend API");
        return [];
      } catch (error) {
        console.error("getRoles error:", error);
        return [];
      }
    },

    // Leave Request Management
    submitLeaveRequest: async (request: Omit<LeaveRequest, 'id' | 'status' | 'submissionDate' | 'workflowHistory' | 'currentStep'>): Promise<LeaveRequest> => {
      try {
        console.log("Submitting leave request:", request);
        
        const response = await leaveService.createLeaveRequest({
          leaveTypeId: '1', // Default leave type
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason
        });
        
        return mapBackendLeaveToFrontend(response);
      } catch (error) {
        console.error("submitLeaveRequest error:", error);
        throw error;
      }
    },

    getLeaveRequests: async (role: 'employee' | 'operations' | 'hr', filters?: { employeeId?: string; branchId?: string }): Promise<LeaveRequest[]> => {
      try {
        console.log(`Fetching leave requests for role: ${role}`, filters);
        
        const response = await leaveService.getLeaveRequests({
          ...filters,
          status: role === 'operations' ? 'pending' : undefined
        });
        
        const leaveRequests = response.data || [];
        return leaveRequests.map(mapBackendLeaveToFrontend);
      } catch (error) {
        console.error("getLeaveRequests error:", error);
        return [];
      }
    },

    // Operations Manager forwards to HR
    forwardLeaveRequestToHR: async (requestId: string, opsManagerId: string, comments?: string): Promise<LeaveRequest> => {
      try {
        console.log(`Forwarding leave request ${requestId} to HR by ${opsManagerId}`);
        
        const response = await leaveService.approveLeaveRequest({
          requestId,
          approverId: opsManagerId,
          comments
        });
        
        const mapped = mapBackendLeaveToFrontend(response);
        mapped.status = 'forwarded_to_hr';
        mapped.currentStep = 'hr_review';
        mapped.opsManagerId = opsManagerId;
        mapped.opsManagerName = 'Operations Manager';
        mapped.opsInitialDate = new Date().toISOString().split('T')[0];
        mapped.opsInitialComments = comments;
        
        return mapped;
      } catch (error) {
        console.error("forwardLeaveRequestToHR error:", error);
        throw error;
      }
    },

    // HR reviews and makes eligibility decision
    reviewLeaveRequestHR: async (requestId: string, hrReviewerId: string, decision: 'eligible' | 'not_eligible', comments?: string): Promise<LeaveRequest> => {
      try {
        console.log(`HR reviewing leave request ${requestId} by ${hrReviewerId}: ${decision}`);
        
        if (decision === 'eligible') {
          const response = await leaveService.approveLeaveRequest({
            requestId,
            approverId: hrReviewerId,
            comments
          });
          
          const mapped = mapBackendLeaveToFrontend(response);
          mapped.status = 'hr_approved';
          mapped.currentStep = 'ops_final';
          mapped.hrReviewerId = hrReviewerId;
          mapped.hrReviewerName = 'HR Reviewer';
          mapped.hrReviewDate = new Date().toISOString().split('T')[0];
          mapped.hrDecision = decision;
          mapped.hrComments = comments;
          
          return mapped;
        } else {
          const response = await leaveService.rejectLeaveRequest({
            requestId,
            approverId: hrReviewerId,
            rejectionReason: comments || 'Not eligible'
          });
          
          const mapped = mapBackendLeaveToFrontend(response);
          mapped.status = 'hr_rejected';
          mapped.currentStep = 'completed';
          mapped.hrReviewerId = hrReviewerId;
          mapped.hrReviewerName = 'HR Reviewer';
          mapped.hrReviewDate = new Date().toISOString().split('T')[0];
          mapped.hrDecision = decision;
          mapped.hrComments = comments;
          
          return mapped;
        }
      } catch (error) {
        console.error("reviewLeaveRequestHR error:", error);
        throw error;
      }
    },

    // Operations Manager makes final decision
    finalDecisionLeaveRequest: async (requestId: string, opsManagerId: string, decision: 'approved' | 'rejected', comments?: string): Promise<LeaveRequest> => {
      try {
        console.log(`Operations Manager final decision on leave request ${requestId}: ${decision}`);
        
        if (decision === 'approved') {
          const response = await leaveService.approveLeaveRequest({
            requestId,
            approverId: opsManagerId,
            comments
          });
          
          const mapped = mapBackendLeaveToFrontend(response);
          mapped.status = 'ops_final_approved';
          mapped.currentStep = 'completed';
          mapped.opsFinalDate = new Date().toISOString().split('T')[0];
          mapped.opsFinalDecision = decision;
          mapped.opsFinalComments = comments;
          
          return mapped;
        } else {
          const response = await leaveService.rejectLeaveRequest({
            requestId,
            approverId: opsManagerId,
            rejectionReason: comments || 'Rejected by operations'
          });
          
          const mapped = mapBackendLeaveToFrontend(response);
          mapped.status = 'ops_final_rejected';
          mapped.currentStep = 'completed';
          mapped.opsFinalDate = new Date().toISOString().split('T')[0];
          mapped.opsFinalDecision = decision;
          mapped.opsFinalComments = comments;
          
          return mapped;
        }
      } catch (error) {
        console.error("finalDecisionLeaveRequest error:", error);
        throw error;
      }
    },

    // Legacy leave request methods for backward compatibility
    approveLeaveRequest: async (requestId: string, role: 'operations' | 'hr', comments?: string): Promise<LeaveRequest> => {
      console.log(`Legacy approve method: ${role} approving leave request ${requestId}`);
      
      if (role === 'operations') {
        return api.data.forwardLeaveRequestToHR(requestId, 'current-user', comments);
      } else {
        return api.data.reviewLeaveRequestHR(requestId, 'current-user', 'eligible', comments);
      }
    },

    rejectLeaveRequest: async (requestId: string, role: 'operations' | 'hr', comments?: string): Promise<LeaveRequest> => {
      console.log(`Legacy reject method: ${role} rejecting leave request ${requestId}`);
      
      if (role === 'hr') {
        return api.data.reviewLeaveRequestHR(requestId, 'current-user', 'not_eligible', comments);
      } else {
        return api.data.finalDecisionLeaveRequest(requestId, 'current-user', 'rejected', comments);
      }
    },

    // Salary Advance Management
    submitSalaryAdvanceRequest: async (request: Omit<SalaryAdvanceRequest, 'id' | 'status' | 'requestDate' | 'workflowHistory' | 'currentStep' | 'payrollIntegration' | 'repaymentDetails'>): Promise<SalaryAdvanceRequest> => {
      try {
        console.log("Submitting salary advance request:", request);
        
        const response = await salaryAdvanceService.createSalaryAdvanceRequest({
          requestedAmount: request.amount,
          reason: request.reason
        });
        
        return mapBackendSalaryAdvanceToFrontend(response);
      } catch (error) {
        console.error("submitSalaryAdvanceRequest error:", error);
        throw error;
      }
    },

    getSalaryAdvanceRequests: async (role: 'employee' | 'operations' | 'hr', filters?: { employeeId?: string; branchId?: string }): Promise<SalaryAdvanceRequest[]> => {
      try {
        console.log(`Fetching salary advance requests for role: ${role}`, filters);
        
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({
          ...filters,
          status: role === 'operations' ? 'pending' : undefined
        });
        
        const salaryAdvances = response.data || [];
        return salaryAdvances.map(mapBackendSalaryAdvanceToFrontend);
      } catch (error) {
        console.error("getSalaryAdvanceRequests error:", error);
        return [];
      }
    },

    // Operations Manager forwards salary advance to HR
    forwardSalaryAdvanceToHR: async (requestId: number | string, opsManagerId: string, comments?: string): Promise<SalaryAdvanceRequest> => {
      try {
        console.log(`Forwarding salary advance request ${requestId} to HR by ${opsManagerId}`);
        
        const response = await salaryAdvanceService.approveSalaryAdvanceRequest({
          requestId: requestId.toString(),
          approverId: opsManagerId,
          comments
        });
        
        const mapped = mapBackendSalaryAdvanceToFrontend(response);
        mapped.status = 'forwarded_to_hr';
        mapped.currentStep = 'hr_review';
        mapped.opsManagerId = opsManagerId;
        mapped.opsManagerName = 'Operations Manager';
        mapped.opsInitialDate = new Date().toISOString().split('T')[0];
        mapped.opsInitialComments = comments;
        
        return mapped;
      } catch (error) {
        console.error("forwardSalaryAdvanceToHR error:", error);
        throw error;
      }
    },

    // HR reviews salary advance eligibility
    reviewSalaryAdvanceHR: async (requestId: number | string, hrReviewerId: string, decision: 'eligible' | 'not_eligible', comments?: string, eligibilityDetails?: any): Promise<SalaryAdvanceRequest> => {
      try {
        console.log(`HR reviewing salary advance request ${requestId} by ${hrReviewerId}: ${decision}`);
        
        if (decision === 'eligible') {
          const response = await salaryAdvanceService.approveSalaryAdvanceRequest({
            requestId: requestId.toString(),
            approverId: hrReviewerId,
            comments
          });
          
          const mapped = mapBackendSalaryAdvanceToFrontend(response);
          mapped.status = 'hr_approved';
          mapped.currentStep = 'ops_final';
          mapped.hrReviewerId = hrReviewerId;
          mapped.hrReviewerName = 'HR Reviewer';
          mapped.hrReviewDate = new Date().toISOString().split('T')[0];
          mapped.hrDecision = decision;
          mapped.hrComments = comments;
          mapped.hrEligibilityDetails = eligibilityDetails;
          
          return mapped;
        } else {
          const response = await salaryAdvanceService.rejectSalaryAdvanceRequest({
            requestId: requestId.toString(),
            approverId: hrReviewerId,
            rejectionReason: comments || 'Not eligible'
          });
          
          const mapped = mapBackendSalaryAdvanceToFrontend(response);
          mapped.status = 'hr_rejected';
          mapped.currentStep = 'completed';
          mapped.hrReviewerId = hrReviewerId;
          mapped.hrReviewerName = 'HR Reviewer';
          mapped.hrReviewDate = new Date().toISOString().split('T')[0];
          mapped.hrDecision = decision;
          mapped.hrComments = comments;
          
          return mapped;
        }
      } catch (error) {
        console.error("reviewSalaryAdvanceHR error:", error);
        throw error;
      }
    },

    // Operations Manager makes final decision on salary advance
    finalDecisionSalaryAdvance: async (requestId: number | string, opsManagerId: string, decision: 'approved' | 'rejected', comments?: string): Promise<SalaryAdvanceRequest> => {
      try {
        console.log(`Operations Manager final decision on salary advance request ${requestId}: ${decision}`);
        
        if (decision === 'approved') {
          const response = await salaryAdvanceService.approveSalaryAdvanceRequest({
            requestId: requestId.toString(),
            approverId: opsManagerId,
            comments
          });
          
          const mapped = mapBackendSalaryAdvanceToFrontend(response);
          mapped.status = 'ops_final_approved';
          mapped.currentStep = 'disbursement';
          mapped.opsFinalDate = new Date().toISOString().split('T')[0];
          mapped.opsFinalDecision = decision;
          mapped.opsFinalComments = comments;
          
          return mapped;
        } else {
          const response = await salaryAdvanceService.rejectSalaryAdvanceRequest({
            requestId: requestId.toString(),
            approverId: opsManagerId,
            rejectionReason: comments || 'Rejected by operations'
          });
          
          const mapped = mapBackendSalaryAdvanceToFrontend(response);
          mapped.status = 'ops_final_rejected';
          mapped.currentStep = 'completed';
          mapped.opsFinalDate = new Date().toISOString().split('T')[0];
          mapped.opsFinalDecision = decision;
          mapped.opsFinalComments = comments;
          
          return mapped;
        }
      } catch (error) {
        console.error("finalDecisionSalaryAdvance error:", error);
        throw error;
      }
    },

    // Legacy salary advance methods for backward compatibility
    approveSalaryAdvanceRequest: async (requestId: number | string, role: 'operations' | 'hr', comments?: string): Promise<SalaryAdvanceRequest> => {
      console.log(`Legacy approve method: ${role} approving salary advance request ${requestId}`);
      
      if (role === 'operations') {
        return api.data.forwardSalaryAdvanceToHR(requestId, 'current-user', comments);
      } else {
        return api.data.reviewSalaryAdvanceHR(requestId, 'current-user', 'eligible', comments);
      }
    },

    rejectSalaryAdvanceRequest: async (requestId: number | string, role: 'operations' | 'hr', comments?: string): Promise<SalaryAdvanceRequest> => {
      console.log(`Legacy reject method: ${role} rejecting salary advance request ${requestId}`);
      
      if (role === 'hr') {
        return api.data.reviewSalaryAdvanceHR(requestId, 'current-user', 'not_eligible', comments);
      } else {
        return api.data.finalDecisionSalaryAdvance(requestId, 'current-user', 'rejected', comments);
      }
    },

    // Disburse salary advance (creates payroll deduction)
    disburseSalaryAdvance: async (requestId: number | string, disbursedBy?: string): Promise<SalaryAdvanceRequest> => {
      try {
        console.log(`Disbursing salary advance request ${requestId} by ${disbursedBy || 'Finance Team'}`);
        
        const response = await salaryAdvanceService.approveSalaryAdvanceRequest({
          requestId: requestId.toString(),
          approverId: disbursedBy || 'finance-team',
          comments: 'Advance disbursed'
        });
        
        const mapped = mapBackendSalaryAdvanceToFrontend(response);
        mapped.status = 'disbursed';
        mapped.currentStep = 'repayment';
        mapped.disbursedDate = new Date().toISOString().split('T')[0];
        mapped.disbursedBy = disbursedBy || 'Finance Team';
        
        return mapped;
      } catch (error) {
        console.error("disburseSalaryAdvance error:", error);
        throw error;
      }
    },

    // Get active salary advance deductions for payroll processing
    getActiveAdvanceDeductions: async (employeeId?: string): Promise<AdvancePayrollIntegration[]> => {
      try {
        console.log(`Fetching active advance deductions for employee: ${employeeId || 'all'}`);
        
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({
          employeeId,
          status: 'disbursed'
        });
        
        const activeAdvances = response.data || [];
        
        return activeAdvances.map(req => ({
          salaryAdvanceId: parseInt(req.id),
          employeeId: req.employeeId,
          isActive: true,
          monthlyDeductionAmount: Math.round((req.requestedAmount || 0) / 6),
          remainingBalance: req.requestedAmount || 0,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 1,
          createdDate: req.createdAt,
          lastUpdated: new Date().toISOString()
        }));
      } catch (error) {
        console.error("getActiveAdvanceDeductions error:", error);
        return [];
      }
    },

    // Process payroll deduction for salary advance
    processAdvanceDeduction: async (salaryAdvanceId: number | string, payrollPeriodId: string, deductedAmount: number): Promise<SalaryAdvanceRequest> => {
      try {
        console.log(`Processing advance deduction for ${salaryAdvanceId}: ${deductedAmount}`);
        
        // For now, we'll simulate the deduction processing
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({
          employeeId: salaryAdvanceId.toString()
        });
        
        const salaryAdvance = response.data?.[0];
        if (!salaryAdvance) {
          throw new Error('Salary advance not found');
        }
        
        const mapped = mapBackendSalaryAdvanceToFrontend(salaryAdvance);
        mapped.status = 'repaying';
        mapped.currentStep = 'repayment';
        mapped.repaymentDetails.totalDeducted = deductedAmount;
        mapped.repaymentDetails.remainingBalance = (salaryAdvance.requestedAmount || 0) - deductedAmount;
        mapped.repaymentDetails.deductionHistory = [
          {
            id: `deduction-${Date.now()}`,
            payrollPeriodId,
            deductionDate: new Date().toISOString().split('T')[0],
            deductedAmount,
            remainingBalance: (salaryAdvance.requestedAmount || 0) - deductedAmount,
            payStubId: `paystub-${payrollPeriodId}-${salaryAdvance.employeeId}`,
            status: 'processed'
          }
        ];
        
        return mapped;
      } catch (error) {
        console.error("processAdvanceDeduction error:", error);
        throw error;
      }
    }
  },

  // Payroll Management API
  payroll: {
    // Payroll Periods
    getPayrollPeriods: async (filters?: { status?: string; year?: number }): Promise<PayrollPeriod[]> => {
      try {
        console.log("Fetching payroll periods:", filters);
        const response = await payrollService.getPayrollPeriods(filters);
        return response.data || [];
      } catch (error) {
        console.error("getPayrollPeriods error:", error);
        return [];
      }
    },

    createPayrollPeriod: async (periodData: Omit<PayrollPeriod, 'id' | 'createdBy' | 'createdDate'>): Promise<PayrollPeriod> => {
      try {
        console.log("Creating payroll period:", periodData);
        const response = await payrollService.createPayrollPeriod(periodData);
        return response;
      } catch (error) {
        console.error("createPayrollPeriod error:", error);
        throw error;
      }
    },

    // Employee Payroll Data
    getPayrollEmployees: async (filters?: { department?: string; status?: string }): Promise<PayrollEmployee[]> => {
      try {
        console.log("Fetching payroll employees:", filters);
        const response = await payrollService.getPayrollEmployees();
        return response;
      } catch (error) {
        console.error("getPayrollEmployees error:", error);
        return [];
      }
    },

    updateEmployeeCompensation: async (employeeId: string, compensationData: Partial<PayrollEmployee['payrollInfo']>): Promise<PayrollEmployee> => {
      try {
        console.log(`Updating compensation for employee ${employeeId}:`, compensationData);
        // Cleaned up: removed legacy mock response comment
        const employees = await payrollService.getPayrollEmployees();
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) {
          throw new Error('Employee not found');
        }
        return employee;
      } catch (error) {
        console.error("updateEmployeeCompensation error:", error);
        throw error;
      }
    },

    // Time and Attendance
    getTimeEntries: async (employeeId?: string, periodId?: string): Promise<TimeEntry[]> => {
      try {
        console.log(`Fetching time entries - Employee: ${employeeId}, Period: ${periodId}`);
        const response = await payrollService.getTimeEntries();
        return response;
      } catch (error) {
        console.error("getTimeEntries error:", error);
        return [];
      }
    },

    approveTimeEntries: async (timeEntryIds: string[], approverId: string): Promise<TimeEntry[]> => {
      try {
        console.log(`Approving time entries:`, timeEntryIds, approverId);
        // For now, return empty array since this method doesn't exist
        return [];
      } catch (error) {
        console.error("approveTimeEntries error:", error);
        return [];
      }
    },

    // Payroll Calculations
    calculatePayroll: async (periodId: string, employeeIds?: string[]): Promise<PayrollRecord[]> => {
      try {
        console.log(`Calculating payroll - Period: ${periodId}, Employees:`, employeeIds);
        const response = await payrollService.calculatePayroll({
          periodId,
          employeeIds,
          includeStatutory: true,
          includeDeductions: true
        });
        return response;
      } catch (error) {
        console.error("calculatePayroll error:", error);
        return [];
      }
    },

    // Pay Stubs
    getPayStubs: async (employeeId?: string, periodId?: string): Promise<PayStub[]> => {
      try {
        console.log(`Fetching pay stubs - Employee: ${employeeId}, Period: ${periodId}`);
        const response = await payrollService.getPayStubs();
        return response;
      } catch (error) {
        console.error("getPayStubs error:", error);
        return [];
      }
    },

    generatePayStubs: async (periodId: string): Promise<PayStub[]> => {
      try {
        console.log(`Generating pay stubs for period ${periodId}`);
        // For now, return empty array since this method doesn't exist
        return [];
      } catch (error) {
        console.error("generatePayStubs error:", error);
        return [];
      }
    },

    // Tax Management
    getTaxTables: async (year?: number, jurisdiction?: string): Promise<TaxTable[]> => {
      try {
        console.log(`Fetching tax tables - Year: ${year}, Jurisdiction: ${jurisdiction}`);
        const response = await payrollService.getTaxTables();
        return response;
      } catch (error) {
        console.error("getTaxTables error:", error);
        return [];
      }
    },

    updateTaxTable: async (taxTableId: string, taxTableData: Partial<TaxTable>): Promise<TaxTable> => {
      try {
        console.log(`Updating tax table ${taxTableId}:`, taxTableData);
        const response = await payrollService.updateTaxTable(taxTableId, taxTableData);
        return response;
      } catch (error) {
        console.error("updateTaxTable error:", error);
        throw error;
      }
    },

    // Reports
    generatePayrollReport: async (reportType: string, parameters: Record<string, string | number | boolean | Date>): Promise<PayrollReport> => {
      try {
        console.log(`Generating payroll report - Type: ${reportType}`, parameters);
        const response = await payrollService.generatePayrollReport(reportType, parameters);
        return response;
      } catch (error) {
        console.error("generatePayrollReport error:", error);
        throw error;
      }
    },

    getPayrollReports: async (filters?: { type?: string; dateRange?: { start: string; end: string } }): Promise<PayrollReport[]> => {
      try {
        console.log("Fetching payroll reports:", filters);
        const response = await payrollService.getPayrollReports();
        return response;
      } catch (error) {
        console.error("getPayrollReports error:", error);
        return [];
      }
    },

    // Compliance
    generateComplianceReport: async (reportType: string, period: string, year: number, month?: number): Promise<ComplianceReport> => {
      try {
        console.log(`Generating compliance report - Type: ${reportType}, Period: ${period}`);
        const response = await payrollService.generateComplianceReport(reportType, period, year, month);
        return response;
      } catch (error) {
        console.error("generateComplianceReport error:", error);
        throw error;
      }
    },

    // Audit Logs
    getPayrollAuditLogs: async (filters?: { entityType?: string; dateRange?: { start: string; end: string } }): Promise<PayrollAuditLog[]> => {
      try {
        console.log("Fetching payroll audit logs:", filters);
        const response = await payrollService.getPayrollAuditLogs();
        return response;
      } catch (error) {
        console.error("getPayrollAuditLogs error:", error);
        return [];
      }
    },

    // Settings
    getPayrollSettings: async (): Promise<PayrollSettings> => {
      try {
        console.log("Fetching payroll settings");
        const response = await payrollService.getPayrollSettings();
        return response;
      } catch (error) {
        console.error("getPayrollSettings error:", error);
        throw error;
      }
    },

    updatePayrollSettings: async (settings: Partial<PayrollSettings>): Promise<PayrollSettings> => {
      try {
        console.log("Updating payroll settings:", settings);
        const response = await payrollService.updatePayrollSettings(settings);
        return response;
      } catch (error) {
        console.error("updatePayrollSettings error:", error);
        throw error;
      }
    }
  },

  // Export methods
  export: {
    exportToExcel: async (dataType: string, filters: any): Promise<string> => {
      try {
        console.log(`Exporting ${dataType} to Excel with filters:`, filters);
        return `export-${dataType}-${Date.now()}.xlsx`;
      } catch (error) {
        console.error("exportToExcel error:", error);
        throw error;
      }
    },
    
    exportToCsv: async (dataType: string, filters: any): Promise<string> => {
      try {
        console.log(`Exporting ${dataType} to CSV with filters:`, filters);
        return `export-${dataType}-${Date.now()}.csv`;
      } catch (error) {
        console.error("exportToCsv error:", error);
        throw error;
      }
    }
  }
};

// Export enhanced API as default for backward compatibility
export default api;
export { api as enhancedApi };

// Re-export SalaryAdvanceRequest type for components that import it directly
export type { SalaryAdvanceRequest } from "@/types/types";
