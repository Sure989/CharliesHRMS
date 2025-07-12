/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LeaveRequest, SalaryAdvanceRequest, User } from '@/types/types';

export interface WorkflowStep {
  id: string;
  name: string;
  role: 'employee' | 'operations' | 'hr' | 'admin';
  action: 'submit' | 'approve' | 'reject' | 'disburse';
  nextStep?: string;
  conditions?: (request: any) => boolean;
}

export interface WorkflowInstance {
  id: string;
  type: 'leave' | 'salary_advance';
  requestId: number;
  currentStep: string;
  status: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  history: WorkflowHistoryEntry[];
}

export interface WorkflowHistoryEntry {
  stepId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  comments?: string;
  previousStatus: string;
  newStatus: string;
}

export interface NotificationEvent {
  id: string;
  type: 'assignment' | 'approval' | 'rejection' | 'completion';
  workflowId: string;
  recipientRole: string;
  recipientId?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// Leave Request Workflow Definition
export const LEAVE_WORKFLOW: WorkflowStep[] = [
  {
    id: 'submit',
    name: 'Submit Request',
    role: 'employee',
    action: 'submit',
    nextStep: 'ops_review'
  },
  {
    id: 'ops_review',
    name: 'Operations Review & Decision',
    role: 'operations',
    action: 'approve', // Operations approves or rejects
    // No nextStep: workflow ends here
  }
];

// Salary Advance Workflow Definition
export const SALARY_ADVANCE_WORKFLOW: WorkflowStep[] = [
  {
    id: 'submit',
    name: 'Submit Request',
    role: 'employee',
    action: 'submit',
    nextStep: 'ops_forward'
  },
  {
    id: 'ops_forward',
    name: 'Operations Forward',
    role: 'operations',
    action: 'approve', // Operations forwards (doesn't approve/reject)
    nextStep: 'hr_review'
  },
  {
    id: 'hr_review',
    name: 'HR Review & Decision',
    role: 'hr',
    action: 'approve', // HR makes the final decision
    nextStep: 'disburse'
  },
  {
    id: 'disburse',
    name: 'Disbursement',
    role: 'hr',
    action: 'disburse'
  }
];

export class WorkflowEngine {
  private workflows: Map<string, WorkflowInstance> = new Map();
  private notifications: NotificationEvent[] = [];

  // Create a new workflow instance
  createWorkflow(
    type: 'leave' | 'salary_advance',
    requestId: number,
    submittedBy: string
  ): WorkflowInstance {
    const workflowId = `${type}_${requestId}_${Date.now()}`;
    const workflow: WorkflowInstance = {
      id: workflowId,
      type,
      requestId,
      currentStep: 'submit',
      status: type === 'leave' ? 'pending_ops' : 'pending_ops',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{
        stepId: 'submit',
        action: 'submit',
        performedBy: submittedBy,
        performedAt: new Date().toISOString(),
        previousStatus: 'draft',
        newStatus: type === 'leave' ? 'pending_ops' : 'pending_ops'
      }]
    };

    this.workflows.set(workflowId, workflow);
    this.assignToNextRole(workflow);
    return workflow;
  }

  // Progress workflow to next step
  progressWorkflow(
    workflowId: string,
    action: 'approve' | 'reject',
    performedBy: string,
    comments?: string
  ): WorkflowInstance | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const currentStep = this.getCurrentStep(workflow);
    if (!currentStep) return null;

    const previousStatus = workflow.status;
    let newStatus = workflow.status;
    let nextStepId: string | undefined;

    if (action === 'approve') {
      nextStepId = this.getNextStep(workflow, currentStep);
      newStatus = this.getStatusForStep(workflow.type, nextStepId || 'completed');
    } else {
      newStatus = workflow.type === 'leave' ? 'rejected' : 'rejected';
    }

    // Update workflow
    workflow.status = newStatus;
    workflow.currentStep = nextStepId || 'completed';
    workflow.updatedAt = new Date().toISOString();
    
    // Add history entry
    workflow.history.push({
      stepId: currentStep.id,
      action,
      performedBy,
      performedAt: new Date().toISOString(),
      comments,
      previousStatus,
      newStatus
    });

    // Assign to next role if workflow continues
    if (nextStepId && action === 'approve') {
      this.assignToNextRole(workflow);
    }

    // Generate notifications
    this.generateNotifications(workflow, action, performedBy);

    return workflow;
  }

  // Forward workflow to next step (for operations managers)
  forwardWorkflow(
    workflowId: string,
    performedBy: string,
    comments?: string
  ): WorkflowInstance | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const currentStep = this.getCurrentStep(workflow);
    if (!currentStep || currentStep.role !== 'operations') return null;

    const previousStatus = workflow.status;
    const nextStepId = this.getNextStep(workflow, currentStep);
    const newStatus = this.getStatusForStep(workflow.type, nextStepId || 'completed');

    // Update workflow
    workflow.status = newStatus;
    workflow.currentStep = nextStepId || 'completed';
    workflow.updatedAt = new Date().toISOString();
    
    // Add history entry
    workflow.history.push({
      stepId: currentStep.id,
      action: 'forward',
      performedBy,
      performedAt: new Date().toISOString(),
      comments,
      previousStatus,
      newStatus
    });

    // Assign to next role if workflow continues
    if (nextStepId) {
      this.assignToNextRole(workflow);
    }

    // Generate notifications for forwarding
    this.generateForwardNotifications(workflow, performedBy);

    return workflow;
  }

  // Get current workflow step
  private getCurrentStep(workflow: WorkflowInstance): WorkflowStep | null {
    const workflowDef = workflow.type === 'leave' ? LEAVE_WORKFLOW : SALARY_ADVANCE_WORKFLOW;
    return workflowDef.find(step => step.id === workflow.currentStep) || null;
  }

  // Get next step ID in the workflow
  private getNextStep(workflow: WorkflowInstance, currentStep: WorkflowStep): string | undefined {
    const workflowDef = workflow.type === 'leave' ? LEAVE_WORKFLOW : SALARY_ADVANCE_WORKFLOW;
    const currentIndex = workflowDef.findIndex(step => step.id === currentStep.id);
    if (currentIndex === -1 || currentIndex === workflowDef.length - 1) return undefined;
    return workflowDef[currentIndex + 1].id;
  }

  // Get status string for a given step, based on workflow type
  private getStatusForStep(type: 'leave' | 'salary_advance', stepId: string): string {
    if (type === 'leave') {
      // Only two steps: submit -> ops_review (pending_ops), then completed (approved/rejected)
      switch (stepId) {
        case 'ops_review':
          return 'pending_ops';
        case 'completed':
          return 'approved';
        default:
          return 'pending_ops';
      }
    } else {
      // Salary advance logic unchanged
      switch (stepId) {
        case 'ops_forward': return 'pending_ops';
        case 'hr_review': return 'pending_hr';
        case 'disburse': return 'approved';
        case 'completed': return 'disbursed';
        default: return 'pending_ops';
      }
    }
  }

  // Assign workflow to the next role based on current step
  private assignToNextRole(workflow: WorkflowInstance) {
    const currentStep = this.getCurrentStep(workflow);
    if (!currentStep) return;

    if (workflow.type === 'leave') {
      // Only assign to operations for leave
      workflow.assignedTo = currentStep.role === 'employee' ? 'operations' : undefined;
    } else {
      // Salary advance logic unchanged
      if (currentStep.role === 'employee') {
        workflow.assignedTo = 'operations';
      } else if (currentStep.role === 'operations') {
        workflow.assignedTo = 'hr';
      } else if (currentStep.role === 'hr') {
        workflow.assignedTo = 'admin';
      }
    }
  }

  // Generate notifications for workflow actions
  private generateNotifications(workflow: WorkflowInstance, action: string, performedBy: string) {
    const currentStep = this.getCurrentStep(workflow);
    if (!currentStep) return;

    let notification: NotificationEvent | null = null;
    if (action === 'approve') {
      notification = {
        id: `${workflow.id}_approve_${Date.now()}`,
        type: 'approval',
        workflowId: workflow.id,
        recipientRole: currentStep.role,
        title: `Workflow Approved`,
        message: `Your workflow has been approved by ${performedBy}.`,
        createdAt: new Date().toISOString(),
        read: false
      };
    } else if (action === 'reject') {
      notification = {
        id: `${workflow.id}_reject_${Date.now()}`,
        type: 'rejection',
        workflowId: workflow.id,
        recipientRole: currentStep.role,
        title: `Workflow Rejected`,
        message: `Your workflow has been rejected by ${performedBy}.`,
        createdAt: new Date().toISOString(),
        read: false
      };
    }

    if (notification) {
      this.notifications.push(notification);
    }
  }

  // Generate notifications for workflow forwarding
  private generateForwardNotifications(workflow: WorkflowInstance, performedBy: string) {
    const currentStep = this.getCurrentStep(workflow);
    if (!currentStep) return;

    const notification: NotificationEvent = {
      id: `${workflow.id}_forward_${Date.now()}`,
      type: 'assignment',
      workflowId: workflow.id,
      recipientRole: currentStep.role,
      title: `Workflow Forwarded`,
      message: `The workflow has been forwarded to you by ${performedBy}.`,
      createdAt: new Date().toISOString(),
      read: false
    };

    this.notifications.push(notification);
  }

  // Get notifications for a given role
  getNotificationsByRole(role: string): NotificationEvent[] {
    return this.notifications.filter(notif => notif.recipientRole === role);
  }
}

// Export singleton instance for use throughout the app
export const workflowEngine = new WorkflowEngine();
