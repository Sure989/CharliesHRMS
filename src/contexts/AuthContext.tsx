import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/types';
import { authService } from '@/services/api/auth.service';
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
      // Try to get current user from API if authenticated
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get current user:', error);
          // Clear invalid tokens and user data on failure
          await authService.logout();
          setUser(null);
        }
      } else {
        // Check for stored user data (fallback)
        const storedUserData = authService.getCurrentUserData();
        if (storedUserData) {
          setUser(storedUserData);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('AuthContext: Login attempt with email:', email);

    try {
      // Use real API authentication
      console.log('AuthContext: Using API authentication');
      try {
        const loginResponse = await authService.login({ email, password });
        console.log('AuthContext: Login response received:', !!loginResponse);
        
        if (loginResponse && loginResponse.user) {
          console.log('AuthContext: Setting user state with:', loginResponse.user);
          setUser(loginResponse.user);
          setIsLoading(false);
          return true;
        }
        
        console.log('AuthContext: Login response invalid');
        setIsLoading(false);
        return false;
      } catch (apiError) {
        console.error('AuthContext: API login error:', apiError);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Unexpected login error:', error);
      setIsLoading(false);
      return false;
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
    if (authService.isAuthenticated()) {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to refresh user:', error);
        await logout();
      }
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
