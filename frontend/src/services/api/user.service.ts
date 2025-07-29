import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';
import { User } from '@/types/types';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
  permissions?: string[];
}

export interface ChangeUserPasswordRequest {
  userId: string;
  newPassword: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class UserService {
  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);
      // department filter removed
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<User[]>(`/users?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>(`/users/${userId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to get user');
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<any>('/users/profile');
      return response;
    } catch (error) {
      console.error('Get current user profile error:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post<{ user: User }>('/users', userData);
      
      if (response.status === 'success' && response.data) {
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to create user');
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put<{ user?: User }>(`/users/${userId}`, userData);
      
      if (response.status === 'success' && response.data) {
        // Accept both { user } and direct user object
        return (response.data as any).user || response.data;
      }
      
      throw new Error(response.message || 'Failed to update user');
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changeUserPassword(passwordData: ChangeUserPasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post(`/users/${passwordData.userId}/change-password`, {
        password: passwordData.newPassword
      });
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change user password error:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string): Promise<User> {
    try {
      const response = await apiClient.patch<{ user: User }>(`/users/${userId}/status`, { status });
      
      if (response.status === 'success' && response.data) {
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to update user status');
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: string, permissions: string[]): Promise<User> {
    try {
      const response = await apiClient.patch<{ user: User }>(`/users/${userId}/permissions`, { permissions });
      
      if (response.status === 'success' && response.data) {
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to update user permissions');
    } catch (error) {
      console.error('Update user permissions error:', error);
      throw error;
    }
  }

  /**
   * Get available roles
   */
  async getRoles(): Promise<Array<{ id: string; name: string; description: string; permissions: string[] }>> {
    try {
      const response = await apiClient.get<Array<{ id: string; name: string; description: string; permissions: string[] }>>('/users/roles');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get roles');
    } catch (error) {
      console.error('Get roles error:', error);
      throw error;
    }
  }

  /**
   * Get available departments
   */
  async getDepartments(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await apiClient.get<Array<{ id: string; name: string }>>('/users/departments');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get departments');
    } catch (error) {
      console.error('Get departments error:', error);
      throw error;
    }
  }

  /**
   * Get available permissions
   */
  async getPermissions(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/users/permissions');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get permissions');
    } catch (error) {
      console.error('Get permissions error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    hrManagerUsers: number;
  }> {
    try {
      const response = await apiClient.get<{
        totalUsers: number;
        activeUsers: number;
        adminUsers: number;
        hrManagerUsers: number;
      }>('/users/stats');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get user statistics');
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
