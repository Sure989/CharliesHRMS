import { apiClient, ApiResponse } from '../apiClient';
import { Role, User } from '@/types/types';

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

class RoleService {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<{roles: Role[]}>('/roles');
      
      if (response.status === 'success' && response.data && response.data.roles) {
        return response.data.roles;
      }
      
      throw new Error(response.message || 'Failed to fetch roles');
    } catch (error) {
      console.error('Get roles error:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await apiClient.get<{role: Role}>(`/roles/${id}`);
      
      if (response.status === 'success' && response.data && response.data.role) {
        return response.data.role;
      }
      
      throw new Error(response.message || 'Failed to get role');
    } catch (error) {
      console.error('Get role by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    try {
      const response = await apiClient.post<{role: Role}>('/roles', roleData);
      
      if (response.status === 'success' && response.data && response.data.role) {
        return response.data.role;
      }
      
      throw new Error(response.message || 'Failed to create role');
    } catch (error) {
      console.error('Create role error:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<Role> {
    try {
      const response = await apiClient.put<{role: Role}>(`/roles/${id}`, roleData);
      
      if (response.status === 'success' && response.data && response.data.role) {
        return response.data.role;
      }
      
      throw new Error(response.message || 'Failed to update role');
    } catch (error) {
      console.error('Update role error:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/roles/${id}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Delete role error:', error);
      throw error;
    }
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(id: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{permissions: string[]}>(`/roles/${id}/permissions`);
      
      if (response.status === 'success' && response.data && response.data.permissions) {
        return response.data.permissions;
      }
      
      throw new Error(response.message || 'Failed to get role permissions');
    } catch (error) {
      console.error('Get role permissions error:', error);
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
    try {
      const response = await apiClient.patch<{role: Role}>(`/roles/${id}/permissions`, { permissions });
      
      if (response.status === 'success' && response.data && response.data.role) {
        return response.data.role;
      }
      
      throw new Error(response.message || 'Failed to update role permissions');
    } catch (error) {
      console.error('Update role permissions error:', error);
      throw error;
    }
  }

  /**
   * Get users with role
   */
  async getUsersWithRole(id: string): Promise<User[]> {
    try {
      const response = await apiClient.get<{users: User[]}>(`/roles/${id}/users`);
      
      if (response.status === 'success' && response.data && response.data.users) {
        return response.data.users;
      }
      
      throw new Error(response.message || 'Failed to get users with role');
    } catch (error) {
      console.error('Get users with role error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const roleService = new RoleService();
