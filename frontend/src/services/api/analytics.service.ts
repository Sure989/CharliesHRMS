import { apiClient, ApiResponse } from '../apiClient';

export interface DashboardMetrics {
  employees: {
    total: number;
    active: number;
    inactive: number;
    newHires: number;
    recentHires: Array<{
      id: string;
      name: string;
      position: string;
      department: string;
      hireDate?: string;
    }>;
    departmentDistribution: Array<{
      department: string;
      count: number;
      percentage: number;
    }>;
    branchDistribution: Array<any>;
  };
  payroll: {
    currentPeriod: {
      id: string;
      name: string;
      totalEmployees: number;
      totalGrossPay: number;
      totalNetPay: number;
      totalDeductions: number;
      status: string;
    };
    monthlyTrend: Array<any>;
    upcomingPayments: Array<any>;
    costBreakdown: {
      salaries: number;
      statutory: number;
      benefits: number;
      overtime: number;
    };
  };
  leave: {
    pendingRequests: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    totalDaysRequested: number;
    leaveTypeBreakdown: Array<any>;
    upcomingLeaves: Array<any>;
    departmentLeaveStats: Array<any>;
  };
  salaryAdvances: {
    pendingRequests: number;
    approvedThisMonth: number;
    totalOutstanding: number;
    averageAmount: number;
    repaymentRate: number;
    monthlyTrend: Array<any>;
    riskMetrics: {
      highRiskEmployees: number;
      overduePayments: number;
      defaultRate: number;
    };
  };
  departmentPerformance: Array<{
    department: string;
    averageScore: number;
    reviewsCount: number;
  }>;
  alerts: Array<any>;
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalBranches: number;
  pendingLeaveRequests: number;
  upcomingReviews: number;
  payrollCosts: {
    currentMonth: number;
    previousMonth: number;
    percentageChange: number;
  };
  leaveUtilization: {
    totalDaysAllocated: number;
    totalDaysUsed: number;
    utilizationRate: number;
  };
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }>;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  branch?: string;
  employeeId?: string;
  reportType?: string;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'payroll' | 'leave' | 'employee' | 'performance' | 'salary_advance';
  filters: ReportFilters;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    nextRun: string;
  };
  createdBy: string;
  createdAt: string;
  lastRun?: string;
}

class AnalyticsService {
  private lastDashboardFetch: number = 0;
  private dashboardCache: DashboardMetrics | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  /**
   * Get dashboard metrics for a specific role
   */
  async getDashboardMetrics(role?: string): Promise<DashboardMetrics> {
    const now = Date.now();
    
    // Return cached data if recent enough
    if (this.dashboardCache && (now - this.lastDashboardFetch) < this.CACHE_DURATION) {
      console.log('Returning cached dashboard metrics');
      return this.dashboardCache;
    }

    try {
      console.log('Fetching fresh dashboard metrics');
      // Always use the generic dashboard endpoint
      const response = await apiClient.get<DashboardMetrics>(`/analytics/dashboard`);
      console.log('API Response (dashboard):', JSON.stringify(response, null, 2)); // Debug log
      
      if (response.status === 'success' && response.data) {
        this.dashboardCache = response.data;
        this.lastDashboardFetch = now;
        return response.data;
      }
      throw new Error(response.message || 'Failed to get dashboard metrics');
    } catch (error) {
      console.error('Get dashboard metrics error:', error);
      // Return cached data if available, even if stale
      if (this.dashboardCache) {
        console.log('Returning stale cached data due to error');
        return this.dashboardCache;
      }
      throw error;
    }
  }

  /**
   * Get real-time metrics (for live updates)
   */
  async getRealTimeMetrics(): Promise<{
    activeUsers: number;
    pendingApprovals: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    lastUpdated: string;
  }> {
    try {
      const response = await apiClient.get<any>('/analytics/realtime');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get real-time metrics');
    } catch (error) {
      console.error('Get real-time metrics error:', error);
      throw error;
    }
  }

  /**
   * Get employee analytics
   */
  async getEmployeeAnalytics(filters?: ReportFilters): Promise<{
    headcount: TimeSeriesData;
    turnover: TimeSeriesData;
    demographics: {
      ageGroups: Array<{ range: string; count: number }>;
      genderDistribution: Array<{ gender: string; count: number }>;
      tenureDistribution: Array<{ range: string; count: number }>;
    };
    departmentGrowth: TimeSeriesData;
    hireVsTermination: TimeSeriesData;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/analytics/employees?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get employee analytics');
    } catch (error) {
      console.error('Get employee analytics error:', error);
      throw error;
    }
  }

  /**
   * Get payroll analytics
   */
  async getPayrollAnalytics(filters?: ReportFilters): Promise<{
    costTrends: TimeSeriesData;
    departmentCosts: TimeSeriesData;
    salaryDistribution: Array<{ range: string; count: number }>;
    overtimeTrends: TimeSeriesData;
    deductionBreakdown: Array<{ type: string; amount: number }>;
    payrollEfficiency: {
      processingTime: number;
      errorRate: number;
      complianceScore: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/analytics/payroll?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get payroll analytics');
    } catch (error) {
      console.error('Get payroll analytics error:', error);
      throw error;
    }
  }

  /**
   * Get leave analytics
   */
  async getLeaveAnalytics(filters?: ReportFilters): Promise<{
    leaveTrends: TimeSeriesData;
    leaveTypeUsage: Array<{ type: string; days: number; requests: number }>;
    departmentLeaveRates: Array<{ department: string; rate: number }>;
    seasonalPatterns: TimeSeriesData;
    approvalMetrics: {
      averageApprovalTime: number;
      approvalRate: number;
      rejectionReasons: Array<{ reason: string; count: number }>;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/analytics/leave?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get leave analytics');
    } catch (error) {
      console.error('Get leave analytics error:', error);
      throw error;
    }
  }

  /**
   * Get salary advance analytics
   */
  async getSalaryAdvanceAnalytics(filters?: ReportFilters): Promise<{
    requestTrends: TimeSeriesData;
    approvalRates: TimeSeriesData;
    repaymentPerformance: TimeSeriesData;
    riskAnalysis: {
      riskDistribution: Array<{ risk: string; count: number }>;
      defaultPrediction: Array<{ month: string; predictedDefaults: number }>;
    };
    departmentUtilization: Array<{ department: string; utilization: number }>;
    amountDistribution: Array<{ range: string; count: number }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/analytics/salary-advances?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get salary advance analytics');
    } catch (error) {
      console.error('Get salary advance analytics error:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(filters?: ReportFilters): Promise<{
    ratingDistribution: Array<{ rating: number; percentage: number }>;
    summary: {
      averageRating: number;
      completedReviews: number;
      totalReviews: number;
    };
    goalProgress: {
      completionRate: number;
    };
  }> {
    try {
      // Try analytics endpoint first, fallback to performance-reviews
      try {
        const analyticsResponse = await apiClient.get<any>('/analytics/performance-reviews');
        if (analyticsResponse.status === 'success' && analyticsResponse.data) {
          return analyticsResponse.data;
        }
      } catch (analyticsError) {
        console.log('Analytics endpoint failed, falling back to performance-reviews');
      }
      
      // Fallback: Get performance reviews data directly
      const reviewsResponse = await apiClient.get<{ reviews: any[] }>('/performance-reviews');
      
      if (reviewsResponse.status === 'success' && reviewsResponse.data?.reviews) {
        const reviews = reviewsResponse.data.reviews;
        
        // Calculate rating distribution
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let completedReviews = 0;
        
        reviews.forEach(review => {
          if (review.score && review.score > 0) {
            const rating = Math.round(review.score);
            if (rating >= 1 && rating <= 5) {
              ratingCounts[rating]++;
              totalRating += review.score;
              completedReviews++;
            }
          }
        });
        
        const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
          rating: parseInt(rating),
          percentage: completedReviews > 0 ? Math.round((count / completedReviews) * 100) : 0
        }));
        
        return {
          ratingDistribution,
          summary: {
            averageRating: completedReviews > 0 ? totalRating / completedReviews : 0,
            completedReviews,
            totalReviews: reviews.length
          },
          goalProgress: {
            completionRate: 75 // Default value since we don't have goal completion data
          }
        };
      }
      
      // Return empty data if no reviews
      return {
        ratingDistribution: [],
        summary: {
          averageRating: 0,
          completedReviews: 0,
          totalReviews: 0
        },
        goalProgress: {
          completionRate: 0
        }
      };
    } catch (error) {
      console.error('Get performance analytics error:', error);
      // Return empty data structure to avoid errors
      return {
        ratingDistribution: [],
        summary: {
          averageRating: 0,
          completedReviews: 0,
          totalReviews: 0
        },
        goalProgress: {
          completionRate: 0
        }
      };
    }
  }

  /**
   * Get training analytics
   */
  async getTrainingAnalytics(filters?: ReportFilters): Promise<{
    programs: Array<{
      program: string;
      completed: number;
      total: number;
      percentage: number;
    }>;
    completionRate: number;
    upcomingTrainings: Array<{
      title: string;
      startDate: string;
      endDate: string;
      enrolledCount: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/analytics/training?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get training analytics');
    } catch (error) {
      console.error('Get training analytics error:', error);
      // Return default structure with empty arrays to avoid errors
      return {
        programs: [],
        completionRate: 0,
        upcomingTrainings: []
      };
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(reportConfig: {
    name: string;
    type: string;
    filters: ReportFilters;
    format: 'pdf' | 'excel' | 'csv';
    includeCharts: boolean;
  }): Promise<{
    reportId: string;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
    estimatedTime?: number;
  }> {
    try {
      const response = await apiClient.post<any>('/analytics/reports/generate', reportConfig);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to generate custom report');
    } catch (error) {
      console.error('Generate custom report error:', error);
      throw error;
    }
  }

  /**
   * Get custom reports
   */
  async getCustomReports(): Promise<CustomReport[]> {
    try {
      const response = await apiClient.get<CustomReport[]>('/analytics/reports');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get custom reports');
    } catch (error) {
      console.error('Get custom reports error:', error);
      throw error;
    }
  }

  /**
   * Schedule report
   */
  async scheduleReport(reportId: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
  }): Promise<CustomReport> {
    try {
      const response = await apiClient.post<CustomReport>(`/analytics/reports/${reportId}/schedule`, schedule);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to schedule report');
    } catch (error) {
      console.error('Schedule report error:', error);
      throw error;
    }
  }

  /**
   * Get system alerts
   */
  async getSystemAlerts(filters?: { 
    type?: string; 
    module?: string; 
    severity?: string;
    limit?: number;
  }): Promise<DashboardMetrics['alerts']> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<DashboardMetrics['alerts']>(`/analytics/alerts?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get system alerts');
    } catch (error) {
      console.error('Get system alerts error:', error);
      throw error;
    }
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const response = await apiClient.patch(`/analytics/alerts/${alertId}/read`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to mark alert as read');
      }
    } catch (error) {
      console.error('Mark alert as read error:', error);
      throw error;
    }
  }

  /**
   * Get data export
   */
  async exportData(exportConfig: {
    type: 'employees' | 'payroll' | 'leave' | 'salary_advances' | 'performance';
    format: 'csv' | 'excel' | 'pdf';
    filters?: ReportFilters;
    includeArchived?: boolean;
  }): Promise<void> {
    try {
      const params = new URLSearchParams();
      Object.entries(exportConfig).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      await apiClient.downloadFile(`/analytics/export?${params.toString()}`, `${exportConfig.type}-export.${exportConfig.format}`);
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  /**
   * Get audit trail
   */
  async getAuditTrail(filters?: {
    userId?: string;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      userId: string;
      userName: string;
      action: string;
      module: string;
      details: any;
      ipAddress: string;
      userAgent: string;
      timestamp: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<any>(`/analytics/audit-trail?${params.toString()}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get audit trail');
    } catch (error) {
      console.error('Get audit trail error:', error);
      throw error;
    }
  }

  /**
   * Get overtime analytics
   */
  async getOvertimeAnalytics(): Promise<{ totalOvertime: number; averageOvertime: number }> {
    try {
      const response = await apiClient.get<any>('/analytics/overtime');
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to get overtime analytics');
    } catch (error) {
      console.error('Get overtime analytics error:', error);
      throw error;
    }
  }

  /**
   * Get diversity analytics (not supported)
   */
  async getDiversityAnalytics(): Promise<{ message: string }> {
    try {
      const response = await apiClient.get<any>('/analytics/diversity');
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to get diversity analytics');
    } catch (error) {
      console.error('Get diversity analytics error:', error);
      throw error;
    }
  }

  /**
   * Get attendance trends (not supported)
   */
  async getAttendanceTrends(): Promise<{ message: string }> {
    try {
      const response = await apiClient.get<any>('/analytics/attendance');
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to get attendance trends');
    } catch (error) {
      console.error('Get attendance trends error:', error);
      throw error;
    }
  }

  /**
   * Get recent HR activities (audit trail)
   */
  async getRecentActivities(limit = 10): Promise<{ data: any[] }> {
    try {
      const response = await apiClient.get<{ data: any[] }>(`/analytics/audit-trail?limit=${limit}`);
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to get recent activities');
    } catch (error) {
      console.error('Get recent activities error:', error);
      return { data: [] };
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
