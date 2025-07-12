import { apiClient } from '@/services/apiClient';
import type { WorkflowInstance, ApprovalRequest } from '@/services/workflowAutomation';

export const workflowApiV2 = {
  async getWorkflows(): Promise<WorkflowInstance[]> {
    const res = await apiClient.get<WorkflowInstance[]>('/workflows');
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch workflows');
    return res.data || [];
  },
  async getApprovals(): Promise<ApprovalRequest[]> {
    const res = await apiClient.get<ApprovalRequest[]>('/workflows/approvals');
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch approvals');
    return res.data || [];
  },
  async getWorkflowStats(): Promise<any> {
    const res = await apiClient.get<any>('/workflows/stats');
    if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch workflow stats');
    return res.data || {};
  },
};
