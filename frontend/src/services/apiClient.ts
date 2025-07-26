import { config } from '@/config/environment';

// API Response interface
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Paginated response interface
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Token Manager for handling authentication tokens
export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_DATA_KEY = 'user_data';

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setUserData(userData: any): void {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  static getUserData(): any | null {
    const data = localStorage.getItem(this.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  static clearAll(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// API Client class
class ApiClient {
  private baseURL: string;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache for identical requests

  constructor() {
    this.baseURL = config.apiBaseUrl || 'http://localhost:3001/api';
  }

  private getCacheKey(endpoint: string, options: RequestInit): string {
    return `${endpoint}-${JSON.stringify(options)}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options);
    const cached = this.requestCache.get(cacheKey);
    
    // Return cached response if recent enough (only for GET requests)
    if (cached && (!options.method || options.method === 'GET')) {
      const age = Date.now() - cached.timestamp;
      if (age < this.CACHE_DURATION) {
        console.log(`Returning cached response for ${endpoint}`);
        return cached.data;
      }
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Throw error with backend error details
        const error: any = new Error(data.message || `HTTP ${response.status}`);
        error.status = 'error';
        error.error = data.error;
        error.errors = data.errors;
        error.response = data;
        throw error;
      }
      const result: ApiResponse<T> = {
        status: 'success',
        data: data.data || data,
        message: data.message,
      };
      // Cache successful GET requests
      if (!options.method || options.method === 'GET') {
        this.requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        error: 'NETWORK_ERROR',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          message: data.message || `HTTP ${response.status}`,
          error: data.error,
          errors: data.errors,
        };
      }

      return {
        status: 'success',
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
        error: 'UPLOAD_ERROR',
      };
    }
  }

  async downloadFile(endpoint: string, filename: string): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
