// Make sure the path to apiClient is correct; adjust as needed:
import { apiClient } from '../apiClient';

export const dashboardService = {
  async getEmployeeDashboard(employeeId: string) {
    return apiClient.get(`/dashboard/employee/${employeeId}`);
  }
};
