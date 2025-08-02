import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';
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
} from '@/types/payroll';

export interface PayrollFilters {
  periodId?: string;
  employeeId?: string;
  department?: string;
  branch?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreatePayrollPeriodRequest {
  name: string;
  startDate: string;
  endDate: string;
  payDate: string;
  description?: string;
}

export interface PayrollCalculationRequest {
  periodId: string;
  employeeIds?: string[];
  includeStatutory?: boolean;
  includeDeductions?: boolean;
}

class PayrollService {
  /**
   * Bulk process payroll for all employees in a period
   */
  async bulkProcessPayroll(periodId: string): Promise<{ processed: number; payStubs: PayStub[] }> {
    try {
      const response = await apiClient.post<{ processed: number; payStubs: PayStub[] }>(`/payroll/periods/${periodId}/process-all`);
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to bulk process payroll');
    } catch (error) {
      console.error('Bulk process payroll error:', error);
      throw error;
    }
  }

  /**
   * Process payroll for a single employee in a period
   */
  async processPayrollForEmployee(periodId: string, employeeId: string): Promise<{ processed: number; payStubs: PayStub[] }> {
    try {
      const response = await apiClient.post<{ processed: number; payStubs: PayStub[] }>(`/payroll/process`, { periodId, employeeId });
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to process payroll for employee');
    } catch (error) {
      console.error('Process payroll for employee error:', error);
      throw error;
    }
  }
  /**
   * Delete payroll record for a specific employee and period
   */
  async deletePayrollRecord(employeeId: string, periodId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/payroll/${employeeId}/${periodId}`);
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete payroll record');
      }
    } catch (error) {
      console.error('Delete payroll record error:', error);
      throw error;
    }
  }
  /**
   * Get all payroll periods with optional filters
   */
  async getPayrollPeriods(filters?: PayrollFilters): Promise<PaginatedResponse<PayrollPeriod>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }


    const response = await apiClient.get<PayrollPeriod[]>(`/payroll/periods?${params.toString()}`);
    // You may want to process the response here as needed
    return response as PaginatedResponse<PayrollPeriod>;
  } catch (error) {
    console.error('Get payroll periods error:', error);
    throw error;
  }
  }

  /**
   * Update a payroll record
   * @param id Payroll record ID
   * @param data Partial payroll record fields to update
   */
  async updatePayrollRecord(id: string, data: any): Promise<any> {
    try {
      const response = await apiClient.put(`/payroll/records/${id}`, data);
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update payroll record');
    } catch (error) {
      console.error('Update payroll record error:', error);
      throw error;
    }
  }

  /**
   * Get payroll period by ID
   */
  async getPayrollPeriodById(id: string): Promise<PayrollPeriod> {
    try {
      const response = await apiClient.get<PayrollPeriod>(`/payroll/periods/${id}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll period');
    } catch (error) {
      console.error('Get payroll period by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new payroll period
   */
  async createPayrollPeriod(periodData: CreatePayrollPeriodRequest): Promise<PayrollPeriod> {
    try {
      const response = await apiClient.post<PayrollPeriod>('/payroll/periods', periodData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create payroll period');
    } catch (error) {
      console.error('Create payroll period error:', error);
      throw error;
    }
  }

  /**
   * Update payroll period
   */
  async updatePayrollPeriod(id: string, periodData: Partial<CreatePayrollPeriodRequest>): Promise<PayrollPeriod> {
    try {
      const response = await apiClient.put<PayrollPeriod>(`/payroll/periods/${id}`, periodData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update payroll period');
    } catch (error) {
      console.error('Update payroll period error:', error);
      throw error;
    }
  }

  /**
   * Delete payroll period
   */
  async deletePayrollPeriod(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/payroll/periods/${id}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete payroll period');
      }
    } catch (error) {
      console.error('Delete payroll period error:', error);
      throw error;
    }
  }

  /**
   * Get payroll employees for a period
   */
  async getPayrollEmployees(periodId?: string, filters?: PayrollFilters): Promise<PayrollEmployee[]> {
    try {
      const params = new URLSearchParams();
      if (periodId) params.append('periodId', periodId);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PayrollEmployee[]>(`/payroll/employees?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll employees');
    } catch (error) {
      console.error('Get payroll employees error:', error);
      throw error;
    }
  }

  /**
   * Calculate payroll for a period
   */
  async calculatePayroll(calculationData: PayrollCalculationRequest): Promise<PayrollRecord[]> {
    try {
      const response = await apiClient.post<PayrollRecord[]>('/payroll/calculate', calculationData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to calculate payroll');
    } catch (error) {
      console.error('Calculate payroll error:', error);
      throw error;
    }
  }

  /**
   * Get payroll records
   */
  async getPayrollRecords(filters?: PayrollFilters): Promise<PaginatedResponse<PayrollRecord>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PayrollRecord[]>(`/payroll/records?${params.toString()}`);
      return response as PaginatedResponse<PayrollRecord>;
    } catch (error) {
      console.error('Get payroll records error:', error);
      throw error;
    }
  }

  /**
   * Get payroll record by ID
   */
  async getPayrollRecordById(id: string): Promise<PayrollRecord> {
    try {
      const response = await apiClient.get<PayrollRecord>(`/payroll/records/${id}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll record');
    } catch (error) {
      console.error('Get payroll record by ID error:', error);
      throw error;
    }
  }

  /**
   * Approve payroll records
   */
  async approvePayrollRecords(recordIds: string[], approverId: string): Promise<PayrollRecord[]> {
    try {
      const response = await apiClient.post<PayrollRecord[]>('/payroll/records/approve', {
        recordIds,
        approverId
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to approve payroll records');
    } catch (error) {
      console.error('Approve payroll records error:', error);
      throw error;
    }
  }

  /**
   * Process payroll (finalize and generate pay stubs)
   */
  async processPayroll(periodId: string): Promise<{ processed: number; payStubs: PayStub[] }> {
    try {
      const response = await apiClient.post<{ processed: number; payStubs: PayStub[] }>(`/payroll/periods/${periodId}/process`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to process payroll');
    } catch (error) {
      console.error('Process payroll error:', error);
      throw error;
    }
  }

  /**
   * Get time entries
   */
  async getTimeEntries(filters?: { employeeId?: string; periodId?: string; startDate?: string; endDate?: string }): Promise<TimeEntry[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<TimeEntry[]>(`/payroll/time-entries?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get time entries');
    } catch (error) {
      console.error('Get time entries error:', error);
      throw error;
    }
  }

  /**
   * Create or update time entry
   */
  async saveTimeEntry(timeEntry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    try {
      const response = await apiClient.post<TimeEntry>('/payroll/time-entries', timeEntry);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to save time entry');
    } catch (error) {
      console.error('Save time entry error:', error);
      throw error;
    }
  }

  /**
   * Approve time entries
   */
  async approveTimeEntries(entryIds: string[], approverId: string): Promise<TimeEntry[]> {
    try {
      const response = await apiClient.post<TimeEntry[]>('/payroll/time-entries/approve', {
        entryIds,
        approverId
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to approve time entries');
    } catch (error) {
      console.error('Approve time entries error:', error);
      throw error;
    }
  }

  /**
   * Get pay stubs
   */
  async getPayStubs(filters?: { employeeId?: string; periodId?: string }): Promise<PayStub[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PayStub[]>(`/payroll/pay-stubs?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get pay stubs');
    } catch (error) {
      console.error('Get pay stubs error:', error);
      throw error;
    }
  }

  /**
   * Get pay stub by ID
   */
  async getPayStubById(id: string): Promise<PayStub> {
    try {
      const response = await apiClient.get<PayStub>(`/payroll/pay-stubs/${id}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get pay stub');
    } catch (error) {
      console.error('Get pay stub by ID error:', error);
      throw error;
    }
  }

  /**
   * Download pay stub as PDF
   */
  async downloadPayStub(id: string): Promise<void> {
    try {
      await apiClient.downloadFile(`/payroll/pay-stubs/${id}/download`, `paystub-${id}.pdf`);
    } catch (error) {
      console.error('Download pay stub error:', error);
      throw error;
    }
  }

  /**
   * Get tax tables
   */
  async getTaxTables(year?: number): Promise<TaxTable[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());

      const response = await apiClient.get<TaxTable[]>(`/payroll/tax-tables?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get tax tables');
    } catch (error) {
      console.error('Get tax tables error:', error);
      throw error;
    }
  }

  /**
   * Update tax table
   */
  async updateTaxTable(id: string, taxTableData: Partial<TaxTable>): Promise<TaxTable> {
    try {
      const response = await apiClient.put<TaxTable>(`/payroll/tax-tables/${id}`, taxTableData);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update tax table');
    } catch (error) {
      console.error('Update tax table error:', error);
      throw error;
    }
  }

  /**
   * Generate payroll report
   */
  async generatePayrollReport(reportType: string, parameters: Record<string, any>): Promise<PayrollReport> {
    try {
      const response = await apiClient.post<PayrollReport>('/payroll/reports/generate', {
        reportType,
        parameters
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to generate payroll report');
    } catch (error) {
      console.error('Generate payroll report error:', error);
      throw error;
    }
  }

  /**
   * Get payroll reports
   */
  async getPayrollReports(filters?: { type?: string; startDate?: string; endDate?: string }): Promise<PayrollReport[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PayrollReport[]>(`/payroll/reports?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll reports');
    } catch (error) {
      console.error('Get payroll reports error:', error);
      throw error;
    }
  }

  /**
   * Download payroll report
   */
  async downloadPayrollReport(id: string, format: 'pdf' | 'excel' | 'csv' = 'pdf'): Promise<void> {
    try {
      await apiClient.downloadFile(`/payroll/reports/${id}/download?format=${format}`, `payroll-report-${id}.${format}`);
    } catch (error) {
      console.error('Download payroll report error:', error);
      throw error;
    }
  }

  /**
   * Get compliance reports
   */
  async getComplianceReports(filters?: { type?: string; year?: number; month?: number }): Promise<ComplianceReport[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<ComplianceReport[]>(`/payroll/compliance?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get compliance reports');
    } catch (error) {
      console.error('Get compliance reports error:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(reportType: string, period: string, year: number, month?: number): Promise<ComplianceReport> {
    try {
      const response = await apiClient.post<ComplianceReport>('/payroll/compliance/generate', {
        reportType,
        period,
        year,
        month
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to generate compliance report');
    } catch (error) {
      console.error('Generate compliance report error:', error);
      throw error;
    }
  }

  /**
   * Get payroll settings
   */
  async getPayrollSettings(): Promise<PayrollSettings> {
    try {
      const response = await apiClient.get<PayrollSettings>('/payroll/settings');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll settings');
    } catch (error) {
      console.error('Get payroll settings error:', error);
      throw error;
    }
  }

  /**
   * Update payroll settings
   */
  async updatePayrollSettings(settings: Partial<PayrollSettings>): Promise<PayrollSettings> {
    try {
      const response = await apiClient.put<PayrollSettings>('/payroll/settings', settings);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update payroll settings');
    } catch (error) {
      console.error('Update payroll settings error:', error);
      throw error;
    }
  }

  /**
   * Get payroll audit logs
   */
  async getPayrollAuditLogs(filters?: { entityType?: string; startDate?: string; endDate?: string }): Promise<PayrollAuditLog[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PayrollAuditLog[]>(`/payroll/audit-logs?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll audit logs');
    } catch (error) {
      console.error('Get payroll audit logs error:', error);
      throw error;
    }
  }

  /**
   * Get payroll statistics
   */
  async getPayrollStatistics(periodId?: string): Promise<{
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalStatutoryDeductions: number;
    totalOtherDeductions: number;
    averageSalary: number;
    payrollCost: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (periodId) params.append('periodId', periodId);

      const response = await apiClient.get<any>(`/payroll/statistics?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll statistics');
    } catch (error) {
      console.error('Get payroll statistics error:', error);
      throw error;
    }
  }

  /**
   * Delete all payroll records for a specific period
   */
  async deletePayrollRecordsByPeriod(periodId: string): Promise<{ deleted: number }> {
    try {
      const response = await apiClient.delete<{ deleted: number }>(`/payroll/periods/${periodId}/records`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to delete payroll records');
    } catch (error) {
      console.error('Delete payroll records error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const payrollService = new PayrollService();
