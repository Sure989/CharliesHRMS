import axios from 'axios';
import { config } from '@/config/environment';

// Token management utility
class TokenManager {
  private static readonly TOKEN_KEY = 'hrms_auth_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// API client setup
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
});

// Attach Authorization header to all requests
apiClient.interceptors.request.use((config) => {
  const token = TokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No token found in localStorage');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
