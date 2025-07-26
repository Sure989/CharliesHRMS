import { apiClient } from '../apiClient';
import { Branch } from '@/types/types';

export interface CreateBranchRequest {
  name: string;
  location?: string;
  address?: string;
  managerId?: string;
  departmentId: string;
}

export interface UpdateBranchRequest {
  name?: string;
  location?: string;
  address?: string;
  managerId?: string;
  departmentId?: string;
  status?: string;
}

export const branchService = {
  // Get all branches
  async getAllBranches(): Promise<Branch[]> {
    const response = await apiClient.get<{branches: Branch[]}>('/branches');
    if (response.status === 'success' && response.data && response.data.branches) {
      return response.data.branches;
    }
    throw new Error(response.message || 'Failed to fetch branches');
  },

  // Get branch by ID
  async getBranchById(id: string): Promise<Branch> {
    const response = await apiClient.get<{branch: Branch}>(`/branches/${id}`);
    if (response.status === 'success' && response.data && response.data.branch) {
      return response.data.branch;
    }
    throw new Error(response.message || 'Failed to fetch branch');
  },

  // Get branches by department
  async getBranchesByDepartment(departmentId: string): Promise<Branch[]> {
    const response = await apiClient.get<{branches: Branch[]}>(`/branches?departmentId=${departmentId}`);
    if (response.status === 'success' && response.data && response.data.branches) {
      return response.data.branches;
    }
    throw new Error(response.message || 'Failed to fetch branches');
  },

  // Create new branch
  async createBranch(data: CreateBranchRequest): Promise<Branch> {
    const response = await apiClient.post<{branch: Branch}>('/branches', data);
    if (response.status === 'success' && response.data && response.data.branch) {
      return response.data.branch;
    }
    throw new Error(response.message || 'Failed to create branch');
  },

  // Update branch
  async updateBranch(id: string, data: UpdateBranchRequest): Promise<Branch> {
    console.log('Branch service - updating branch:', id, 'with data:', data);
    const response = await apiClient.put<{branch: Branch}>(`/branches/${id}`, data);
    console.log('Branch service - update response:', response);
    if (response.status === 'success' && response.data && response.data.branch) {
      return response.data.branch;
    }
    throw new Error(response.message || 'Failed to update branch');
  },

  // Delete branch
  async deleteBranch(id: string): Promise<void> {
    const response = await apiClient.delete(`/branches/${id}`);
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete branch');
    }
  },

  // Get branch statistics
  async getBranchStats(id: string): Promise<any> {
    const response = await apiClient.get<{stats: any}>(`/branches/${id}/stats`);
    if (response.status === 'success' && response.data && response.data.stats) {
      return response.data.stats;
    }
    throw new Error(response.message || 'Failed to fetch branch statistics');
  },

  // Get employees in branch
  async getBranchEmployees(id: string): Promise<any[]> {
    const response = await apiClient.get<{employees: any[]}>(`/branches/${id}/employees`);
    if (response.status === 'success' && response.data && response.data.employees) {
      // DEBUG: Log the structure of returned employees
       
      console.log('DEBUG branchService employees:', response.data.employees);
      return response.data.employees;
    }
    throw new Error(response.message || 'Failed to fetch branch employees');
  }
};
