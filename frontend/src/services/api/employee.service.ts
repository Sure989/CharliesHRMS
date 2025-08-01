import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';
import { User } from '@/types/types';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  branch: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  salary?: number;
  manager?: string;
  profilePicture?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    branchCode: string;
    accountType: string;
  };
  taxInfo?: {
    kraPin?: string;
    nssfNumber?: string;
    nhifNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  branch: string;
  hireDate: string;
  salary?: number;
  manager?: string;
  address?: Employee['address'];
  emergencyContact?: Employee['emergencyContact'];
  bankDetails?: Employee['bankDetails'];
  taxInfo?: Employee['taxInfo'];
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  status?: Employee['status'];
}

export interface EmployeeFilters {
  department?: string;
  branch?: string;
  status?: Employee['status'];
  position?: string;
  manager?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class EmployeeService {
  /**
   * Helper method to map status from backend to frontend format
   */
  private mapStatusFromBackend(status: string): Employee['status'] {
    const statusMap: Record<string, Employee['status']> = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'TERMINATED': 'terminated'
    };
    return statusMap[status?.toUpperCase()] || status?.toLowerCase() as Employee['status'];
  }

  /**
   * Helper method to map status from frontend to backend format
   */
  private mapStatusToBackend(status: Employee['status']): string {
    const statusMap: Record<Employee['status'], string> = {
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'terminated': 'TERMINATED'
    };
    return statusMap[status] || status?.toUpperCase();
  }

  /**
   * Helper method to transform backend employee data to frontend format
   */
  private transformEmployeeFromBackend(emp: any): Employee {
    return {
      id: emp.id,
      employeeId: emp.employeeNumber || emp.employeeId, // Handle both field names
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      department: typeof emp.department === 'object' ? emp.department?.name || '' : emp.department || '',
      branch: typeof emp.branch === 'object' ? emp.branch?.name || '' : emp.branch || '',
      hireDate: emp.hireDate,
      status: this.mapStatusFromBackend(emp.status),
      salary: emp.salary,
      manager: emp.manager,
      profilePicture: emp.profilePicture,
      address: emp.address,
      emergencyContact: emp.emergencyContact,
      bankDetails: emp.bankDetails,
      taxInfo: emp.taxInfo,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt
    };
  }

  /**
   * Helper method to transform frontend employee data to backend format
   */
  private transformEmployeeToBackend(employeeData: CreateEmployeeRequest | UpdateEmployeeRequest): any {
    const backendData: any = {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      phone: employeeData.phone,
      position: employeeData.position,
      hireDate: employeeData.hireDate,
      salary: employeeData.salary,
      manager: employeeData.manager,
      address: employeeData.address,
      emergencyContact: employeeData.emergencyContact,
      bankDetails: employeeData.bankDetails,
      taxInfo: employeeData.taxInfo
    };

    // Handle employeeId/employeeNumber mapping
    if ('employeeId' in employeeData && employeeData.employeeId) {
      backendData.employeeNumber = employeeData.employeeId;
    } else if ('firstName' in employeeData && 'lastName' in employeeData) {
      // Generate employeeNumber if not provided (for create operations)
      backendData.employeeNumber = employeeData.firstName.substring(0, 1) + 
                                   employeeData.lastName.substring(0, 1) + 
                                   Date.now().toString().substring(8);
    }

    // Handle department and branch - assume they are IDs if provided
    if (employeeData.department) {
      backendData.departmentId = employeeData.department;
    }
    if (employeeData.branch) {
      backendData.branchId = employeeData.branch;
    }

    // Handle status mapping for update operations
    if ('status' in employeeData && employeeData.status) {
      backendData.status = this.mapStatusToBackend(employeeData.status);
    }

    // Remove undefined values
    Object.keys(backendData).forEach(key => {
      if (backendData[key] === undefined) {
        delete backendData[key];
      }
    });

    return backendData;
  }

  /**
   * Get all employees with optional filters (backward compatibility)
   */
  async getAll(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    return this.getEmployees(filters);
  }

  /**
   * Get all employees with optional filters
   */
  async getEmployees(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Map frontend status to backend status for filtering
            if (key === 'status' && typeof value === 'string') {
              params.append(key, this.mapStatusToBackend(value as Employee['status']));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      // Include relations
      params.append('includeRelations', 'true');

      const response = await apiClient.get<{employees: any[]}>(`/employees?${params.toString()}`);
      
      if (response.status === 'success' && response.data && response.data.employees) {
        // Transform all employees from backend format
        const employees = response.data.employees.map(emp => this.transformEmployeeFromBackend(emp));
        
        const paginatedResponse: PaginatedResponse<Employee> = {
          ...response,
          data: employees
        };
        return paginatedResponse;
      }
      
      throw new Error(response.message || 'Failed to fetch employees');
    } catch (error) {
      console.error('Get employees error:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await apiClient.get<{employee: any}>(`/employees/${id}`);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to get employee');
    } catch (error) {
      console.error('Get employee by ID error:', error);
      throw error;
    }
  }

  /**
   * Get employee by employee ID (not database ID)
   */
  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee> {
    try {
      const response = await apiClient.get<{employee: any}>(`/employees/by-employee-id/${employeeId}`);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to get employee');
    } catch (error) {
      console.error('Get employee by employee ID error:', error);
      throw error;
    }
  }

  /**
   * Create new employee
   */
  async createEmployee(employeeData: CreateEmployeeRequest): Promise<Employee> {
    try {
      const backendData = this.transformEmployeeToBackend(employeeData);
      const response = await apiClient.post<{employee: any}>('/employees', backendData);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to create employee');
    } catch (error) {
      console.error('Create employee error:', error);
      throw error;
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, employeeData: UpdateEmployeeRequest): Promise<Employee> {
    try {
      const backendData = this.transformEmployeeToBackend(employeeData);
      const response = await apiClient.put<{employee: any}>(`/employees/${id}`, backendData);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to update employee');
    } catch (error) {
      console.error('Update employee error:', error);
      throw error;
    }
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/employees/${id}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Delete employee error:', error);
      throw error;
    }
  }

  /**
   * Activate employee
   */
  async activateEmployee(id: string): Promise<Employee> {
    try {
      const response = await apiClient.patch<{employee: any}>(`/employees/${id}/activate`);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to activate employee');
    } catch (error) {
      console.error('Activate employee error:', error);
      throw error;
    }
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(id: string): Promise<Employee> {
    try {
      const response = await apiClient.patch<{employee: any}>(`/employees/${id}/deactivate`);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to deactivate employee');
    } catch (error) {
      console.error('Deactivate employee error:', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    try {
      const response = await apiClient.get<{employees: any[]}>(`/employees/department/${department}`);
      
      if (response.status === 'success' && response.data && response.data.employees) {
        return response.data.employees.map(emp => this.transformEmployeeFromBackend(emp));
      }
      
      throw new Error(response.message || 'Failed to get employees by department');
    } catch (error) {
      console.error('Get employees by department error:', error);
      throw error;
    }
  }

  /**
   * Get employees by branch
   */
  async getEmployeesByBranch(branch: string): Promise<Employee[]> {
    try {
      const response = await apiClient.get<{employees: any[]}>(`/employees/branch/${branch}`);
      
      if (response.status === 'success' && response.data && response.data.employees) {
        return response.data.employees.map(emp => this.transformEmployeeFromBackend(emp));
      }
      
      throw new Error(response.message || 'Failed to get employees by branch');
    } catch (error) {
      console.error('Get employees by branch error:', error);
      throw error;
    }
  }

  /**
   * Get employees by manager
   */
  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    try {
      const response = await apiClient.get<{employees: any[]}>(`/employees/manager/${managerId}`);
      
      if (response.status === 'success' && response.data && response.data.employees) {
        return response.data.employees.map(emp => this.transformEmployeeFromBackend(emp));
      }
      
      throw new Error(response.message || 'Failed to get employees by manager');
    } catch (error) {
      console.error('Get employees by manager error:', error);
      throw error;
    }
  }

  /**
   * Search employees
   */
  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const response = await apiClient.get<{employees: any[]}>(`/employees/search?q=${encodeURIComponent(query)}`);
      
      if (response.status === 'success' && response.data && response.data.employees) {
        return response.data.employees.map(emp => this.transformEmployeeFromBackend(emp));
      }
      
      throw new Error(response.message || 'Failed to search employees');
    } catch (error) {
      console.error('Search employees error:', error);
      throw error;
    }
  }

  /**
   * Upload employee profile picture
   */
  async uploadProfilePicture(id: string, file: File): Promise<Employee> {
    try {
      const response = await apiClient.uploadFile<{employee: any}>(`/employees/${id}/profile-picture`, file);
      
      if (response.status === 'success' && response.data && response.data.employee) {
        return this.transformEmployeeFromBackend(response.data.employee);
      }
      
      throw new Error(response.message || 'Failed to upload profile picture');
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDepartment: Record<string, number>;
    byBranch: Record<string, number>;
    recentHires: number;
  }> {
    try {
      const response = await apiClient.get<{stats: any}>('/employees/stats');
      
      if (response.status === 'success' && response.data && response.data.stats) {
        return response.data.stats;
      }
      
      throw new Error(response.message || 'Failed to get employee statistics');
    } catch (error) {
      console.error('Get employee stats error:', error);
      throw error;
    }
  }

  /**
   * Export employees data
   */
  async exportEmployees(format: 'csv' | 'excel', filters?: EmployeeFilters): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Map frontend status to backend status for filtering
            if (key === 'status' && typeof value === 'string') {
              params.append(key, this.mapStatusToBackend(value as Employee['status']));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      await apiClient.downloadFile(`/employees/export?${params.toString()}`, `employees.${format}`);
    } catch (error) {
      console.error('Export employees error:', error);
      throw error;
    }
  }

  /**
   * Import employees from file
   */
  async importEmployees(file: File): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    try {
      const response = await apiClient.uploadFile<{result: any}>('/employees/import', file);
      
      if (response.status === 'success' && response.data && response.data.result) {
        return response.data.result;
      }
      
      throw new Error(response.message || 'Failed to import employees');
    } catch (error) {
      console.error('Import employees error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();