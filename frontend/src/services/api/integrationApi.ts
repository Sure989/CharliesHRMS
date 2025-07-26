import { apiClient } from '@/services/apiClient';
import type { IntegrationConfig, IntegrationLog } from '@/services/integrationHub';

export const integrationApi = {
  async getIntegrations(): Promise<IntegrationConfig[]> {
    const res = await apiClient.get<IntegrationConfig[]>('/integrations');
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch integrations');
    return res.data || [];
  },
  async getIntegrationLogs(limit = 50): Promise<IntegrationLog[]> {
    const res = await apiClient.get<IntegrationLog[]>(`/integrations/logs?limit=${limit}`);
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch logs');
    return res.data || [];
  },
  async getIntegrationSummary(): Promise<any> {
    const res = await apiClient.get<any>('/integrations/summary');
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch summary');
    return res.data || {};
  },
  async testIntegration(id: string): Promise<any> {
    const res = await apiClient.post<any>(`/integrations/${id}/test`);
    if (res.status !== 'success') throw new Error(res.message || 'Test failed');
    return res.data;
  },
  async toggleIntegration(id: string, enabled: boolean): Promise<any> {
    const res = await apiClient.patch<any>(`/integrations/${id}/toggle`, { enabled });
    if (res.status !== 'success') throw new Error(res.message || 'Toggle failed');
    return res.data;
  },
};
