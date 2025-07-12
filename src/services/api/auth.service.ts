import { apiClient, ApiResponse, TokenManager } from '../apiClient';
import { User } from '@/types/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface BackendLoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await apiClient.post<BackendLoginResponse>('/auth/login', credentials);
      
      console.log('Login response status:', response.status);
      
      if (response.status === 'success' && response.data) {
        console.log('Login successful, processing response data');
        const { accessToken, refreshToken, user } = response.data;
        
        // Store tokens and user data
        TokenManager.setToken(accessToken);
        TokenManager.setRefreshToken(refreshToken);
        TokenManager.setUserData(user);
        
        console.log('User data stored in TokenManager');
        
        return {
          user,
          token: accessToken,
          refreshToken,
        };
      }
      
      console.error('Login failed with response:', response);
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', userData);
      
      if (response.status === 'success' && response.data) {
        // Store tokens and user data
        TokenManager.setToken(response.data.token);
        TokenManager.setRefreshToken(response.data.refreshToken);
        TokenManager.setUserData(response.data.user);
        
        return response.data;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server request fails
    } finally {
      TokenManager.clearAll();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', {
        refreshToken,
      });

      if (response.status === 'success' && response.data) {
        TokenManager.setToken(response.data.accessToken);
        TokenManager.setRefreshToken(response.data.refreshToken);
        return {
          token: response.data.accessToken,
          refreshToken: response.data.refreshToken
        };
      }

      throw new Error(response.message || 'Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      TokenManager.clearAll();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      
      if (response.status === 'success' && response.data) {
        TokenManager.setUserData(response.data.user);
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to get user profile');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/auth/profile', userData);
      
      if (response.status === 'success' && response.data) {
        TokenManager.setUserData(response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post('/auth/change-password', passwordData);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post('/auth/reset-password', resetData);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await apiClient.post('/auth/resend-verification');
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  /**
   * Get stored user data
   */
  getCurrentUserData(): User | null {
    return TokenManager.getUserData();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUserData();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserData();
    return user?.role === role;
  }
}

// Export singleton instance
export const authService = new AuthService();
