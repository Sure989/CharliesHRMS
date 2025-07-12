import { apiClient } from '@/services/apiClient';
import type { WorkflowTemplate } from '@/services/workflowAutomation';

export const workflowApi = {
  async getTemplates(): Promise<WorkflowTemplate[]> {
    const res = await apiClient.get<WorkflowTemplate[]>('/workflow-templates');
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch workflow templates');
    return res.data || [];
  },
  // Add more workflow API methods as needed
};
