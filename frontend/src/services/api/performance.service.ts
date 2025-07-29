import { apiClient, ApiResponse } from '../apiClient';

export interface PerformanceData {
  currentScore: number;
  averageScore: number;
  latestReview: any;
  reviewHistory: any[];
  goals: any[];
  trend: number;
}

export interface PerformanceAnalytics {
  summary: {
    totalReviews: number;
    averageScore: number;
    completedReviews: number;
    pendingReviews: number;
  };
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    averageScore: number;
    reviewCount: number;
  }>;
  goalProgress: {
    completionRate: number;
  };
}

class PerformanceService {
  /**
   * Get performance data for a specific employee
   */
  async getPerformanceScore(employeeId: string): Promise<PerformanceData> {
    try {
      const response = await apiClient.get<PerformanceData>(`/performance/employee/${employeeId}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get performance data');
    } catch (error) {
      console.error('Get performance score error:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics for the organization
   */
  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    try {
      const response = await apiClient.get<PerformanceAnalytics>('/performance/analytics');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get performance analytics');
    } catch (error) {
      console.error('Get performance analytics error:', error);
      throw error;
    }
  }

  /**
   * Get employee performance data (alias for backward compatibility)
   */
  async getEmployeePerformance(employeeId: string): Promise<PerformanceData> {
    return this.getPerformanceScore(employeeId);
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
