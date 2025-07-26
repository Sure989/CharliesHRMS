import { apiClient } from '../apiClient';
import { Department } from '@/types/types';

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  managerId?: string;
  status?: string;
}

export const departmentService = {
  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    const response = await apiClient.get<{departments: Department[]}>('/departments');
    if (response.status === 'success' && response.data && response.data.departments) {
      return response.data.departments;
    }
    throw new Error(response.message || 'Failed to fetch departments');
  },

  // Get department by ID
  async getDepartmentById(id: string): Promise<Department> {
    const response = await apiClient.get<{department: Department}>(`/departments/${id}`);
    if (response.status === 'success' && response.data && response.data.department) {
      return response.data.department;
    }
    throw new Error(response.message || 'Failed to fetch department');
  },

  // Create new department
  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const response = await apiClient.post<{department: Department}>('/departments', data);
    if (response.status === 'success' && response.data && response.data.department) {
      return response.data.department;
    }
    throw new Error(response.message || 'Failed to create department');
  },

  // Update department
  async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    console.log('Department service - updating department:', id, 'with data:', data);
    const response = await apiClient.put<{department: Department}>(`/departments/${id}`, data);
    console.log('Department service - update response:', response);
    if (response.status === 'success' && response.data && response.data.department) {
      return response.data.department;
    }
    throw new Error(response.message || 'Failed to update department');
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    const response = await apiClient.delete(`/departments/${id}`);
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete department');
    }
  },

  // Get department statistics
  async getDepartmentStats(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/departments/${id}/stats`);
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch department statistics');
  }
};
