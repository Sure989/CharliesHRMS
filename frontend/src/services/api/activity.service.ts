import { apiClient } from '../apiClient';

export const activityService = {
  async getRecentActivities(employeeId: string) {
    // Replace with your backend endpoint
    return apiClient.get(`/employees/${employeeId}/activity`);
  }
};
