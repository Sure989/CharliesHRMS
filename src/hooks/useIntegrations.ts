import { useState, useEffect, useCallback } from 'react';
import { integrationApi } from '@/services/api/integrationApi';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  successRate?: number;
  lastSyncTime?: string;
  features?: string[];
  config?: Record<string, any>;
  createdAt?: string;
}

interface IntegrationLog {
  id: string;
  integrationId: string;
  action: string;
  status: string;
  duration?: number;
  message?: string;
  timestamp: string;
}

interface IntegrationSummary {
  totalIntegrations: number;
  activeIntegrations: number;
  errorIntegrations: number;
  averageSuccessRate: number;
  lastSyncTime?: string;
}

interface UseIntegrationsReturn {
  // Data
  integrations: Integration[];
  integrationLogs: IntegrationLog[];
  integrationSummary: IntegrationSummary;
  
  // Loading states
  isLoading: boolean;
  isTestingAll: boolean;
  rowLoading: Record<string, 'test' | 'toggle' | null>;
  
  // Error handling
  error: string;
  
  // Actions
  loadDashboardData: () => Promise<void>;
  testIntegration: (id: string) => Promise<void>;
  toggleIntegration: (id: string, enabled: boolean) => Promise<void>;
  testAllIntegrations: () => Promise<void>;
  exportLogs: () => Promise<void>;
}

export const useIntegrations = (): UseIntegrationsReturn => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [integrationSummary, setIntegrationSummary] = useState<IntegrationSummary>({
    totalIntegrations: 0,
    activeIntegrations: 0,
    errorIntegrations: 0,
    averageSuccessRate: 0,
    lastSyncTime: undefined
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [rowLoading, setRowLoading] = useState<Record<string, 'test' | 'toggle' | null>>({});
  const [error, setError] = useState<string>('');
  
  const { toast } = useToast();

  const loadDashboardData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const [allIntegrations, logs, summary] = await Promise.all([
        integrationApi.getIntegrations(),
        integrationApi.getIntegrationLogs(50),
        integrationApi.getIntegrationSummary()
      ]);
      
      setIntegrations(allIntegrations);
      setIntegrationLogs(logs);
      setIntegrationSummary(summary);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setIntegrations([]);
      setIntegrationLogs([]);
      setIntegrationSummary({
        totalIntegrations: 0,
        activeIntegrations: 0,
        errorIntegrations: 0,
        averageSuccessRate: 0,
        lastSyncTime: undefined
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testIntegration = useCallback(async (integrationId: string): Promise<void> => {
    setRowLoading((prev) => ({ ...prev, [integrationId]: 'test' }));
    try {
      const res = await integrationApi.testIntegration(integrationId);
      toast({ 
        title: 'Test Successful', 
        description: res.message || 'Integration test completed.',
        variant: 'default' 
      });
      await loadDashboardData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Integration test failed.';
      toast({ 
        title: 'Test Failed', 
        description: errorMessage,
        variant: 'destructive' 
      });
    } finally {
      setRowLoading((prev) => ({ ...prev, [integrationId]: null }));
    }
  }, [loadDashboardData, toast]);

  const toggleIntegration = useCallback(async (integrationId: string, enabled: boolean): Promise<void> => {
    setRowLoading((prev) => ({ ...prev, [integrationId]: 'toggle' }));
    try {
      await integrationApi.toggleIntegration(integrationId, enabled);
      toast({ 
        title: `Integration ${enabled ? 'Enabled' : 'Disabled'}`,
        variant: 'default' 
      });
      await loadDashboardData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle integration.';
      toast({ 
        title: 'Toggle Failed', 
        description: errorMessage,
        variant: 'destructive' 
      });
    } finally {
      setRowLoading((prev) => ({ ...prev, [integrationId]: null }));
    }
  }, [loadDashboardData, toast]);

  const testAllIntegrations = useCallback(async (): Promise<void> => {
    setIsTestingAll(true);
    try {
      for (const integration of integrations) {
        await integrationApi.testIntegration(integration.id);
      }
      toast({ 
        title: 'All Integrations Tested', 
        description: 'All integrations tested successfully.',
        variant: 'default' 
      });
      await loadDashboardData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test all integrations.';
      toast({ 
        title: 'Test All Failed', 
        description: errorMessage,
        variant: 'destructive' 
      });
    } finally {
      setIsTestingAll(false);
    }
  }, [integrations, loadDashboardData, toast]);

  const exportLogs = useCallback(async (): Promise<void> => {
    try {
      const logs = await integrationApi.getIntegrationLogs(1000);
      const csv = [
        'Timestamp,Integration,Action,Status,Duration,Message',
        ...logs.map(log => 
          `"${log.timestamp}","${log.integrationId}","${log.action}","${log.status}",${log.duration || ''},"${(log.message || '').replace(/"/g, '""')}"`
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `integration-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Export Successful', 
        description: 'Logs exported successfully.',
        variant: 'default' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export logs.';
      toast({ 
        title: 'Export Failed', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    // Data
    integrations,
    integrationLogs,
    integrationSummary,
    
    // Loading states
    isLoading,
    isTestingAll,
    rowLoading,
    
    // Error handling
    error,
    
    // Actions
    loadDashboardData,
    testIntegration,
    toggleIntegration,
    testAllIntegrations,
    exportLogs,
  };
};
