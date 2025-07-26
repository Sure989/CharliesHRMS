import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryOverDays: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  carriedOverDays: number;
  leaveType: LeaveType;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  attachments?: string[];
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    position: string;
  };
  leaveType: LeaveType;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachments?: File[];
}

export interface LeaveRequestFilters {
  employeeId?: string;
  leaveTypeId?: string;
  status?: string;
  department?: string;
  branchName?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  approverId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApproveLeaveRequest {
  requestId: string;
  approverId: string;
  comments?: string;
}

export interface RejectLeaveRequest {
  requestId: string;
  approverId: string;
  rejectionReason: string;
}

export interface LeaveCalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  department: string;
}

class LeaveService {
  /**
   * Get all leave types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      const response = await apiClient.get<LeaveType[]>('/leave/types');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave types');
    } catch (error) {
      console.error('Get leave types error:', error);
      throw error;
    }
  }

  /**
   * Create leave type
   */
  async createLeaveType(leaveTypeData: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> {
    try {
      const response = await apiClient.post<LeaveType>('/leave/types', leaveTypeData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create leave type');
    } catch (error) {
      console.error('Create leave type error:', error);
      throw error;
    }
  }

  /**
   * Update leave type
   */
  async updateLeaveType(id: string, leaveTypeData: Partial<LeaveType>): Promise<LeaveType> {
    try {
      const response = await apiClient.put<LeaveType>(`/leave/types/${id}`, leaveTypeData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update leave type');
    } catch (error) {
      console.error('Update leave type error:', error);
      throw error;
    }
  }

  /**
   * Delete leave type
   */
  async deleteLeaveType(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/leave/types/${id}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete leave type');
      }
    } catch (error) {
      console.error('Delete leave type error:', error);
      throw error;
    }
  }

  /**
   * Get leave balances for an employee
   */
  async getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());

        const response = await apiClient.get<LeaveBalance[]>(`/employees/${employeeId}/leave?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave balances');
    } catch (error) {
      console.error('Get leave balances error:', error);
      throw error;
    }
  }

  /**
   * Get all leave balances with filters
   */
  async getAllLeaveBalances(filters?: { year?: number; department?: string; employeeId?: string }): Promise<LeaveBalance[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<LeaveBalance[]>(`/leave/balances?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave balances');
    } catch (error) {
      console.error('Get all leave balances error:', error);
      throw error;
    }
  }

  /**
   * Update leave balance
   */
  async updateLeaveBalance(id: string, balanceData: Partial<LeaveBalance>): Promise<LeaveBalance> {
    try {
      const response = await apiClient.put<LeaveBalance>(`/leave/balances/${id}`, balanceData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update leave balance');
    } catch (error) {
      console.error('Update leave balance error:', error);
      throw error;
    }
  }

  /**
   * Get leave requests with filters
   */
  async getLeaveRequests(filters?: LeaveRequestFilters): Promise<PaginatedResponse<LeaveRequest>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<LeaveRequest[]>(`/leave/requests?${params.toString()}`);
      return response as PaginatedResponse<LeaveRequest>;
    } catch (error) {
      console.error('Get leave requests error:', error);
      throw error;
    }
  }

  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    try {
      const response = await apiClient.get<LeaveRequest>(`/leave/requests/${id}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave request');
    } catch (error) {
      console.error('Get leave request by ID error:', error);
      throw error;
    }
  }

  /**
   * Create leave request
   */
  async createLeaveRequest(requestData: CreateLeaveRequestRequest): Promise<LeaveRequest> {
    try {
      // If there are attachments, upload them first
      if (requestData.attachments && requestData.attachments.length > 0) {
        const uploadPromises = requestData.attachments.map(file => 
          apiClient.uploadFile<{ url: string }>('/leave/attachments', file)
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        const attachmentUrls = uploadResults.map(result => result.data?.url).filter(Boolean) as string[];
        
        const requestPayload = {
          ...requestData,
          attachments: attachmentUrls
        };
        delete (requestPayload as any).attachments; // Remove File objects
        
        const response = await apiClient.post<LeaveRequest>('/leave/requests', {
          ...requestPayload,
          attachments: attachmentUrls
        });
        
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        
        throw new Error(response.message || 'Failed to create leave request');
      } else {
        const response = await apiClient.post<LeaveRequest>('/leave/requests', {
          employeeId: requestData.employeeId,
          leaveTypeId: requestData.leaveTypeId,
          startDate: requestData.startDate,
          endDate: requestData.endDate,
          reason: requestData.reason
        });
        
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        
        throw new Error(response.message || 'Failed to create leave request');
      }
    } catch (error) {
      console.error('Create leave request error:', error);
      throw error;
    }
  }

  /**
   * Update leave request
   */
  async updateLeaveRequest(id: string, requestData: Partial<CreateLeaveRequestRequest>): Promise<LeaveRequest> {
    try {
      const response = await apiClient.put<LeaveRequest>(`/leave/requests/${id}`, requestData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update leave request');
    } catch (error) {
      console.error('Update leave request error:', error);
      throw error;
    }
  }

  /**
   * Cancel leave request
   */
  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    try {
      const response = await apiClient.patch<LeaveRequest>(`/leave/requests/${id}/cancel`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to cancel leave request');
    } catch (error) {
      console.error('Cancel leave request error:', error);
      throw error;
    }
  }

  /**
   * Approve or reject leave request (unified)
   */
  async decideLeaveRequest(requestId: string, decision: 'APPROVED' | 'REJECTED', reason?: string): Promise<LeaveRequest> {
    try {
      const response = await apiClient.put<LeaveRequest>(`/leave/requests/${requestId}/decision`, {
        decision,
        reason,
      });
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || `Failed to ${decision === 'APPROVED' ? 'approve' : 'reject'} leave request`);
    } catch (error) {
      console.error('Leave decision error:', error);
      throw error;
    }
  }

  /**
   * Bulk approve leave requests
   */
  async bulkApproveLeaveRequests(requestIds: string[], approverId: string): Promise<LeaveRequest[]> {
    try {
      const response = await apiClient.post<LeaveRequest[]>('/leave/requests/bulk-approve', {
        requestIds,
        approverId
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to bulk approve leave requests');
    } catch (error) {
      console.error('Bulk approve leave requests error:', error);
      throw error;
    }
  }

  /**
   * Get leave calendar events
   */
  async getLeaveCalendar(filters?: { 
    startDate?: string; 
    endDate?: string; 
    department?: string; 
    employeeId?: string;
  }): Promise<LeaveCalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<LeaveCalendarEvent[]>(`/leave/calendar?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave calendar');
    } catch (error) {
      console.error('Get leave calendar error:', error);
      throw error;
    }
  }

  /**
   * Get leave statistics
   */
  async getLeaveStatistics(filters?: { 
    year?: number; 
    department?: string; 
    employeeId?: string;
  }): Promise<{
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    totalDaysRequested: number;
    totalDaysApproved: number;
    averageDaysPerRequest: number;
    leaveTypeBreakdown: Array<{
      leaveType: string;
      count: number;
      totalDays: number;
    }>;
    departmentBreakdown: Array<{
      department: string;
      count: number;
      totalDays: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/leave/statistics?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave statistics');
    } catch (error) {
      console.error('Get leave statistics error:', error);
      throw error;
    }
  }

  /**
   * Export leave data
   */
  async exportLeaveData(format: 'csv' | 'excel', filters?: LeaveRequestFilters): Promise<void> {
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

      await apiClient.downloadFile(`/leave/export?${params.toString()}`, `leave-data.${format}`);
    } catch (error) {
      console.error('Export leave data error:', error);
      throw error;
    }
  }

  /**
   * Get pending approvals for a manager
   */
  async getPendingApprovals(managerId: string): Promise<LeaveRequest[]> {
    try {
      const response = await apiClient.get<LeaveRequest[]>(`/leave/pending-approvals/${managerId}`);
      
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
   * Check leave conflicts
   */
  async checkLeaveConflicts(employeeId: string, startDate: string, endDate: string): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      type: 'existing_leave' | 'insufficient_balance' | 'blackout_period';
      message: string;
      details?: any;
    }>;
  }> {
    try {
      const response = await apiClient.post<any>('/leave/check-conflicts', {
        employeeId,
        startDate,
        endDate
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to check leave conflicts');
    } catch (error) {
      console.error('Check leave conflicts error:', error);
      throw error;
    }
  }

  /**
   * Get leave policy information
   */
  async getLeavePolicy(): Promise<{
    maxConsecutiveDays: number;
    minAdvanceNotice: number;
    blackoutPeriods: Array<{
      startDate: string;
      endDate: string;
      description: string;
    }>;
    carryOverPolicy: {
      enabled: boolean;
      maxDays: number;
      expiryDate: string;
    };
  }> {
    try {
      const response = await apiClient.get<any>('/leave/policy');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave policy');
    } catch (error) {
      console.error('Get leave policy error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leaveService = new LeaveService();
