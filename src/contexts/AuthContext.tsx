import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/types';
import { authService } from '@/services/api/auth.service';
import { employeeService } from '@/services/api/employee.service';
import { config } from '@/config/environment';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser && currentUser.employeeId) {
          // Fetch employee details by database UUID
          const employeeDetails = await employeeService.getEmployeeById(currentUser.employeeId);
          // Set user.employeeId to employeeNumber (business ID) for consistent lookups
          setUser({ ...currentUser, ...employeeDetails, employeeId: employeeDetails.employeeId });
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const loginResponse = await authService.login({ email, password });
      if (loginResponse && loginResponse.user) {
        const { user: authUser } = loginResponse;
        if (authUser && authUser.employeeId) {
          // Fetch employee details by database UUID
          const employeeDetails = await employeeService.getEmployeeById(authUser.employeeId);
          // Set user.employeeId to employeeNumber (business ID) for consistent lookups
          const fullUser = { ...authUser, ...employeeDetails, employeeId: employeeDetails.employeeId, branch: employeeDetails.branch || employeeDetails.department };
          setUser(fullUser);
          authService.setAuthData({ token: loginResponse.token, user: fullUser, refreshToken: loginResponse.refreshToken });
        } else {
          setUser(authUser);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Real API logout
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user state even if API call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser && currentUser.employeeId) {
          // Fetch employee details by database UUID
          const employeeDetails = await employeeService.getEmployeeById(currentUser.employeeId);
          // Set user.employeeId to employeeNumber (business ID) for consistent lookups
          const fullUser = { ...currentUser, ...employeeDetails, employeeId: employeeDetails.employeeId, branch: employeeDetails.branch || employeeDetails.department };
          setUser(fullUser);
          authService.setAuthData({ token: authService.getToken() || '', user: fullUser, refreshToken: authService.getRefreshToken() });
        } else {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
