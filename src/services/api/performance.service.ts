import { apiClient } from '../apiClient';

export const performanceService = {
  async getPerformanceScore(employeeId: string) {
    // Replace with your backend endpoint
    return apiClient.get(`/employees/${employeeId}/performance`);
  }
};
