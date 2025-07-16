import { apiClient } from '../apiClient';

export const trainingService = {
  async getTrainingProgress(employeeId: string) {
    // Replace with your backend endpoint
    return apiClient.get(`/employees/training/progress/${employeeId}`);
  }
};
