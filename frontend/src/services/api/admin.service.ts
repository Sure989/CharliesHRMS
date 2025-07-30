import { apiClient } from '../apiClient';

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  database: 'healthy' | 'warning' | 'critical';
  authentication: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
  lastChecked: string;
}

export interface SystemActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

export interface MaintenanceInfo {
  lastMaintenance: string | null;
  nextMaintenance: string;
  systemUptime: string;
  uptimeDays: number;
  maintenanceWindow: string;
}

export interface ComplianceOverview {
  overallStatus: 'compliant' | 'warning' | 'non-compliant';
  lastAuditDate: string | null;
  nextAuditDate: string;
  pendingIssues: number;
  resolvedIssues: number;
  totalPolicies: number;
  compliantPolicies: number;
}

export interface ComplianceViolation {
  id: string;
  policy: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'In Progress';
  description: string;
  employeeId?: string;
  employeeName?: string;
}

export interface PolicyCompliance {
  id: string;
  name: string;
  status: 'Compliant' | 'Warning' | 'Non-Compliant';
  lastReview: string;
  nextReview: string;
  violationCount: number;
}

export interface ExperimentalFeature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface CreateExperimentalFeatureDto {
  key: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
}

export interface UpdateExperimentalFeatureDto {
  name?: string;
  description?: string | null;
  enabled?: boolean;
}

class AdminService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/dashboard/metrics');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get dashboard metrics');
    } catch (error) {
      console.error('Get dashboard metrics error:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await apiClient.get<SystemStatus>('/admin/system-status');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get system status');
    } catch (error) {
      console.error('Get system status error:', error);
      throw error;
    }
  }

  /**
   * Get recent system activities
   */
  async getSystemActivities(limit = 10): Promise<SystemActivity[]> {
    try {
      const response = await apiClient.get<SystemActivity[]>(`/admin/system-activities?limit=${limit}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get system activities');
    } catch (error) {
      console.error('Get system activities error:', error);
      throw error;
    }
  }

  /**
   * Get maintenance information
   */
  async getMaintenanceInfo(): Promise<MaintenanceInfo> {
    try {
      const response = await apiClient.get<MaintenanceInfo>('/admin/maintenance-info');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get maintenance info');
    } catch (error) {
      console.error('Get maintenance info error:', error);
      throw error;
    }
  }

  /**
   * Trigger database backup
   */
  async triggerDatabaseBackup(): Promise<{ backupId: string; status: string; timestamp: string }> {
    try {
      const response = await apiClient.post<{ backupId: string; status: string; timestamp: string }>('/admin/database-backup');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to trigger database backup');
    } catch (error) {
      console.error('Database backup error:', error);
      throw error;
    }
  }

  /**
   * Clear system cache
   */
  async clearCache(): Promise<{ timestamp: string; cacheTypes: string[] }> {
    try {
      const response = await apiClient.post<{ timestamp: string; cacheTypes: string[] }>('/admin/clear-cache');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to clear cache');
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  }

  /**
   * Get compliance overview
   */
  async getComplianceOverview(): Promise<ComplianceOverview> {
    try {
      const response = await apiClient.get<ComplianceOverview>('/admin/compliance-overview');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get compliance overview');
    } catch (error) {
      console.error('Get compliance overview error:', error);
      throw error;
    }
  }

  /**
   * Get compliance violations
   */
  async getComplianceViolations(limit = 10): Promise<ComplianceViolation[]> {
    try {
      const response = await apiClient.get<ComplianceViolation[]>(`/admin/compliance-violations?limit=${limit}`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get compliance violations');
    } catch (error) {
      console.error('Get compliance violations error:', error);
      throw error;
    }
  }

  /**
   * Get policy compliance
   */
  async getPolicyCompliance(): Promise<PolicyCompliance[]> {
    try {
      const response = await apiClient.get<PolicyCompliance[]>('/admin/policy-compliance');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get policy compliance');
    } catch (error) {
      console.error('Get policy compliance error:', error);
      throw error;
    }
  }

  /**
   * Get all experimental features
   */
  async getExperimentalFeatures(): Promise<ExperimentalFeature[]> {
    try {
      const response = await apiClient.get<ExperimentalFeature[]>('/admin/experimental-features');
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get experimental features');
    } catch (error) {
      console.error('Get experimental features error:', error);
      throw error;
    }
  }

  /**
   * Create a new experimental feature
   */
  async createExperimentalFeature(data: CreateExperimentalFeatureDto): Promise<ExperimentalFeature> {
    try {
      const response = await apiClient.post<ExperimentalFeature>('/admin/experimental-features', data);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create experimental feature');
    } catch (error) {
      console.error('Create experimental feature error:', error);
      throw error;
    }
  }

  /**
   * Update an experimental feature
   */
  async updateExperimentalFeature(id: string, data: UpdateExperimentalFeatureDto): Promise<ExperimentalFeature> {
    try {
      const response = await apiClient.put<ExperimentalFeature>(`/admin/experimental-features/${id}`, data);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update experimental feature');
    } catch (error) {
      console.error('Update experimental feature error:', error);
      throw error;
    }
  }

  /**
   * Toggle an experimental feature
   */
  async toggleExperimentalFeature(id: string): Promise<ExperimentalFeature> {
    try {
      const response = await apiClient.patch<ExperimentalFeature>(`/admin/experimental-features/${id}/toggle`);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to toggle experimental feature');
    } catch (error) {
      console.error('Toggle experimental feature error:', error);
      throw error;
    }
  }

  /**
   * Delete an experimental feature
   */
  async deleteExperimentalFeature(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/admin/experimental-features/${id}`);
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to delete experimental feature');
      }
    } catch (error) {
      console.error('Delete experimental feature error:', error);
      throw error;
    }
  }

  /**
   * Seed default experimental features
   */
  async seedDefaultFeatures(): Promise<void> {
    try {
      const response = await apiClient.post('/admin/experimental-features/seed');
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to seed default features');
      }
    } catch (error) {
      console.error('Seed default features error:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
