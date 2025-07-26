import { apiClient, ApiResponse } from '../apiClient';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface CreatePermissionRequest {
  name: string;
  description: string;
  category: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  category?: string;
}

class PermissionService {
  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<{permissions: Permission[]}>('/permissions');
      
      if (response.status === 'success' && response.data && response.data.permissions) {
        return response.data.permissions;
      }
      
      throw new Error(response.message || 'Failed to fetch permissions');
    } catch (error) {
      console.error('Get permissions error:', error);
      throw error;
    }
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    try {
      const response = await apiClient.get<{permissions: Permission[]}>(`/permissions/category/${category}`);
      
      if (response.status === 'success' && response.data && response.data.permissions) {
        return response.data.permissions;
      }
      
      throw new Error(response.message || 'Failed to fetch permissions by category');
    } catch (error) {
      console.error('Get permissions by category error:', error);
      throw error;
    }
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission> {
    try {
      const response = await apiClient.get<{permission: Permission}>(`/permissions/${id}`);
      
      if (response.status === 'success' && response.data && response.data.permission) {
        return response.data.permission;
      }
      
      throw new Error(response.message || 'Failed to get permission');
    } catch (error) {
      console.error('Get permission by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new permission
   */
  async createPermission(permissionData: CreatePermissionRequest): Promise<Permission> {
    try {
      const response = await apiClient.post<{permission: Permission}>('/permissions', permissionData);
      
      if (response.status === 'success' && response.data && response.data.permission) {
        return response.data.permission;
      }
      
      throw new Error(response.message || 'Failed to create permission');
    } catch (error) {
      console.error('Create permission error:', error);
      throw error;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(id: string, permissionData: UpdatePermissionRequest): Promise<Permission> {
    try {
      const response = await apiClient.put<{permission: Permission}>(`/permissions/${id}`, permissionData);
      
      if (response.status === 'success' && response.data && response.data.permission) {
        return response.data.permission;
      }
      
      throw new Error(response.message || 'Failed to update permission');
    } catch (error) {
      console.error('Update permission error:', error);
      throw error;
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/permissions/${id}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('Delete permission error:', error);
      throw error;
    }
  }

  /**
   * Get all permission categories
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<{categories: string[]}>('/permissions/categories');
      
      if (response.status === 'success' && response.data && response.data.categories) {
        return response.data.categories;
      }
      
      throw new Error(response.message || 'Failed to fetch permission categories');
    } catch (error) {
      console.error('Get permission categories error:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async checkUserPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{hasPermission: boolean}>(`/users/${userId}/permissions/check/${permissionName}`);
      
      if (response.status === 'success' && response.data) {
        return response.data.hasPermission;
      }
      
      return false;
    } catch (error) {
      console.error('Check user permission error:', error);
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{permissions: string[]}>(`/users/${userId}/permissions`);
      
      if (response.status === 'success' && response.data && response.data.permissions) {
        return response.data.permissions;
      }
      
      throw new Error(response.message || 'Failed to get user permissions');
    } catch (error) {
      console.error('Get user permissions error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
