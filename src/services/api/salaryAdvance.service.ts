import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';

export interface SalaryAdvanceRequest {
  id: string;
  employeeId: string;
  requestedAmount: number;
  maxAllowedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  disbursedDate?: string;
  rejectionReason?: string;
  repaymentSchedule?: RepaymentSchedule[];
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    position: string;
    monthlySalary: number;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RepaymentSchedule {
  id: string;
  salaryAdvanceId: string;
  payrollPeriodId: string;
  scheduledAmount: number;
  actualAmount?: number;
  status: 'pending' | 'deducted' | 'failed';
  scheduledDate: string;
  deductedDate?: string;
  payrollPeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    payDate: string;
  };
}

export interface CreateSalaryAdvanceRequest {
  requestedAmount: number;
  reason: string;
  repaymentMonths?: number; // Default to 3 months
}

export interface SalaryAdvanceFilters {
  employeeId?: string;
  status?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  approverId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApproveSalaryAdvanceRequest {
  requestId: string;
  approverId: string;
  approvedAmount?: number; // Can approve less than requested
  repaymentMonths?: number;
  comments?: string;
}

export interface RejectSalaryAdvanceRequest {
  requestId: string;
  approverId: string;
  rejectionReason: string;
}

export interface SalaryAdvanceEligibility {
  isEligible: boolean;
  maxAmount: number;
  currentOutstanding: number;
  availableAmount: number;
  reasons?: string[];
  lastAdvanceDate?: string;
  creditLimit: number;
  utilizationPercentage: number;
}

export interface SalaryAdvanceSettings {
  id: string;
  maxPercentageOfSalary: number; // 25%
  maxRepaymentMonths: number; // 12 months
  minEmploymentMonths: number; // 6 months
  cooldownPeriodDays: number; // 30 days
  requiresApproval: boolean;
  autoApprovalLimit?: number;
  interestRate: number; // 0% for now
  processingFee: number; // 0% for now
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryAdvanceStatistics {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  disbursedRequests: number;
  totalAmountRequested: number;
  totalAmountApproved: number;
  totalAmountDisbursed: number;
  totalOutstanding: number;
  averageRequestAmount: number;
  averageApprovalTime: number; // in hours
  repaymentRate: number; // percentage
  departmentBreakdown: Array<{
    department: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    requests: number;
    amount: number;
  }>;
}

class SalaryAdvanceService {
  /**
   * Check salary advance eligibility for an employee
   */
  async checkEligibility(employeeId: string): Promise<SalaryAdvanceEligibility> {
    try {
      const response = await apiClient.get<SalaryAdvanceEligibility>(`/salary-advances/eligibility/${employeeId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to check eligibility');
    } catch (error) {
      console.error('Check eligibility error:', error);
      throw error;
    }
  }

  /**
   * Get salary advance requests with filters
   */
  async getSalaryAdvanceRequests(filters?: SalaryAdvanceFilters): Promise<PaginatedResponse<SalaryAdvanceRequest>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<SalaryAdvanceRequest[]>(`/salary-advances?${params.toString()}`);
      return response as PaginatedResponse<SalaryAdvanceRequest>;
    } catch (error) {
      console.error('Get salary advance requests error:', error);
      throw error;
    }
  }

  /**
   * Get salary advance request by ID
   */
  async getSalaryAdvanceRequestById(id: string): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.get<SalaryAdvanceRequest>(`/salary-advances/${id}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get salary advance request');
    } catch (error) {
      console.error('Get salary advance request by ID error:', error);
      throw error;
    }
  }

  /**
   * Create salary advance request
   */
  async createSalaryAdvanceRequest(requestData: CreateSalaryAdvanceRequest): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.post<SalaryAdvanceRequest>('/salary-advances', requestData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create salary advance request');
    } catch (error) {
      console.error('Create salary advance request error:', error);
      throw error;
    }
  }

  /**
   * Update salary advance request (only for pending requests)
   */
  async updateSalaryAdvanceRequest(id: string, requestData: Partial<CreateSalaryAdvanceRequest>): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.put<SalaryAdvanceRequest>(`/salary-advances/${id}`, requestData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update salary advance request');
    } catch (error) {
      console.error('Update salary advance request error:', error);
      throw error;
    }
  }

  /**
   * Cancel salary advance request
   */
  async cancelSalaryAdvanceRequest(id: string): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.patch<SalaryAdvanceRequest>(`/salary-advances/${id}/cancel`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to cancel salary advance request');
    } catch (error) {
      console.error('Cancel salary advance request error:', error);
      throw error;
    }
  }

  /**
   * Approve salary advance request
   */
  async approveSalaryAdvanceRequest(approvalData: ApproveSalaryAdvanceRequest): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.post<SalaryAdvanceRequest>(`/salary-advances/${approvalData.requestId}/approve`, {
        approverId: approvalData.approverId,
        approvedAmount: approvalData.approvedAmount,
        repaymentMonths: approvalData.repaymentMonths,
        comments: approvalData.comments
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to approve salary advance request');
    } catch (error) {
      console.error('Approve salary advance request error:', error);
      throw error;
    }
  }

  /**
   * Reject salary advance request
   */
  async rejectSalaryAdvanceRequest(rejectionData: RejectSalaryAdvanceRequest): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.post<SalaryAdvanceRequest>(`/salary-advances/${rejectionData.requestId}/reject`, {
        approverId: rejectionData.approverId,
        rejectionReason: rejectionData.rejectionReason
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to reject salary advance request');
    } catch (error) {
      console.error('Reject salary advance request error:', error);
      throw error;
    }
  }

  /**
   * Disburse approved salary advance
   */
  async disburseSalaryAdvance(requestId: string, disbursementData: {
    disbursedBy: string;
    disbursementMethod: 'bank_transfer' | 'cash' | 'mobile_money';
    referenceNumber?: string;
    notes?: string;
  }): Promise<SalaryAdvanceRequest> {
    try {
      const response = await apiClient.post<SalaryAdvanceRequest>(`/salary-advances/${requestId}/disburse`, disbursementData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to disburse salary advance');
    } catch (error) {
      console.error('Disburse salary advance error:', error);
      throw error;
    }
  }

  /**
   * Get repayment schedule for a salary advance
   */
  async getRepaymentSchedule(requestId: string): Promise<RepaymentSchedule[]> {
    try {
      const response = await apiClient.get<RepaymentSchedule[]>(`/salary-advances/${requestId}/repayment-schedule`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get repayment schedule');
    } catch (error) {
      console.error('Get repayment schedule error:', error);
      throw error;
    }
  }

  /**
   * Update repayment schedule
   */
  async updateRepaymentSchedule(requestId: string, scheduleData: {
    repaymentMonths: number;
    startDate?: string;
  }): Promise<RepaymentSchedule[]> {
    try {
      const response = await apiClient.put<RepaymentSchedule[]>(`/salary-advances/${requestId}/repayment-schedule`, scheduleData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update repayment schedule');
    } catch (error) {
      console.error('Update repayment schedule error:', error);
      throw error;
    }
  }

  /**
   * Process payroll deductions for salary advances
   */
  async processPayrollDeductions(payrollPeriodId: string): Promise<{
    processed: number;
    totalAmount: number;
    failed: number;
    details: Array<{
      salaryAdvanceId: string;
      employeeId: string;
      amount: number;
      status: 'success' | 'failed';
      error?: string;
    }>;
  }> {
    try {
      const response = await apiClient.post<any>(`/salary-advances/process-deductions/${payrollPeriodId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to process payroll deductions');
    } catch (error) {
      console.error('Process payroll deductions error:', error);
      throw error;
    }
  }

  /**
   * Get pending approvals for a manager
   */
  async getPendingApprovals(managerId: string): Promise<SalaryAdvanceRequest[]> {
    try {
      const response = await apiClient.get<SalaryAdvanceRequest[]>(`/salary-advances/pending-approvals/${managerId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get pending approvals');
    } catch (error) {
      console.error('Get pending approvals error:', error);
      throw error;
    }
  }

  /**
   * Bulk approve salary advance requests
   */
  async bulkApproveSalaryAdvances(requestIds: string[], approverId: string): Promise<SalaryAdvanceRequest[]> {
    try {
      const response = await apiClient.post<SalaryAdvanceRequest[]>('/salary-advances/bulk-approve', {
        requestIds,
        approverId
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to bulk approve salary advances');
    } catch (error) {
      console.error('Bulk approve salary advances error:', error);
      throw error;
    }
  }

  /**
   * Get salary advance statistics
   */
  async getSalaryAdvanceStatistics(filters?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    employeeId?: string;
  }): Promise<SalaryAdvanceStatistics> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<SalaryAdvanceStatistics>(`/salary-advances/statistics?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get salary advance statistics');
    } catch (error) {
      console.error('Get salary advance statistics error:', error);
      throw error;
    }
  }

  /**
   * Get salary advance settings
   */
  async getSalaryAdvanceSettings(): Promise<SalaryAdvanceSettings> {
    try {
      const response = await apiClient.get<SalaryAdvanceSettings>('/salary-advances/settings');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get salary advance settings');
    } catch (error) {
      console.error('Get salary advance settings error:', error);
      throw error;
    }
  }

  /**
   * Update salary advance settings
   */
  async updateSalaryAdvanceSettings(settings: Partial<SalaryAdvanceSettings>): Promise<SalaryAdvanceSettings> {
    try {
      const response = await apiClient.put<SalaryAdvanceSettings>('/salary-advances/settings', settings);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update salary advance settings');
    } catch (error) {
      console.error('Update salary advance settings error:', error);
      throw error;
    }
  }

  /**
   * Get employee's salary advance history
   */
  async getEmployeeSalaryAdvanceHistory(employeeId: string, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SalaryAdvanceRequest[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<SalaryAdvanceRequest[]>(`/salary-advances/employee/${employeeId}/history?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get employee salary advance history');
    } catch (error) {
      console.error('Get employee salary advance history error:', error);
      throw error;
    }
  }

  /**
   * Get outstanding salary advances for an employee
   */
  async getOutstandingSalaryAdvances(employeeId: string): Promise<{
    totalOutstanding: number;
    advances: Array<{
      id: string;
      originalAmount: number;
      remainingAmount: number;
      nextPaymentDate: string;
      nextPaymentAmount: number;
    }>;
  }> {
    try {
      const response = await apiClient.get<any>(`/salary-advances/employee/${employeeId}/outstanding`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get outstanding salary advances');
    } catch (error) {
      console.error('Get outstanding salary advances error:', error);
      throw error;
    }
  }

  /**
   * Export salary advance data
   */
  async exportSalaryAdvanceData(format: 'csv' | 'excel', filters?: SalaryAdvanceFilters): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      await apiClient.downloadFile(`/salary-advances/export?${params.toString()}`, `salary-advances.${format}`);
    } catch (error) {
      console.error('Export salary advance data error:', error);
      throw error;
    }
  }

  /**
   * Generate salary advance report
   */
  async generateSalaryAdvanceReport(reportType: string, parameters: {
    startDate?: string;
    endDate?: string;
    department?: string;
    status?: string;
  }): Promise<{
    id: string;
    reportType: string;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
    generatedAt?: string;
  }> {
    try {
      const response = await apiClient.post<any>('/salary-advances/reports/generate', {
        reportType,
        parameters
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to generate salary advance report');
    } catch (error) {
      console.error('Generate salary advance report error:', error);
      throw error;
    }
  }

  /**
   * Calculate potential deduction for next payroll
   */
  async calculateNextPayrollDeduction(employeeId: string, payrollPeriodId: string): Promise<{
    totalDeduction: number;
    advances: Array<{
      id: string;
      amount: number;
      remainingBalance: number;
    }>;
  }> {
    try {
      const response = await apiClient.get<any>(`/salary-advances/calculate-deduction/${employeeId}/${payrollPeriodId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to calculate next payroll deduction');
    } catch (error) {
      console.error('Calculate next payroll deduction error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const salaryAdvanceService = new SalaryAdvanceService();
