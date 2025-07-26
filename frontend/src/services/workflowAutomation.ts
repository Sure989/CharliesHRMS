export interface WorkflowStep {
  id: string;
  name: string;
  type: 'calculation' | 'validation' | 'approval' | 'notification' | 'integration' | 'condition' | 'action';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  order: number;
  dependencies: string[];
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  timeout?: number;
  retryCount: number;
  maxRetries: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  errorMessage?: string;
  assignedTo?: string;
  approvalRequired: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'calculate_payroll' | 'send_notification' | 'create_approval' | 'sync_data' | 'generate_report' | 'send_payment';
  parameters: Record<string, any>;
  target?: string;
  template?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'payroll_processing' | 'compliance' | 'reporting' | 'payments' | 'custom';
  version: string;
  isActive: boolean;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: Record<string, any>;
  createdBy: string;
  createdDate: string;
  lastModified: string;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'manual' | 'api';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  event?: {
    source: string;
    eventType: string;
    conditions?: WorkflowCondition[];
  };
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  context: Record<string, any>;
  triggeredBy: string;
  triggerType: string;
  progress: number;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  id: string;
  timestamp: string;
  stepId: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: Record<string, any>;
}

export interface ApprovalRequest {
  id: string;
  workflowInstanceId: string;
  stepId: string;
  title: string;
  description: string;
  requestedBy: string;
  assignedTo: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdDate: string;
  respondedDate?: string;
  respondedBy?: string;
  comments?: string;
  attachments?: string[];
  data: Record<string, any>;
}

export class WorkflowAutomationService {
  private static templates: WorkflowTemplate[] = [];
  private static instances: WorkflowInstance[] = [];
  private static approvalRequests: ApprovalRequest[] = [];

  /**
   * Initialize default workflow templates
   */
  static initializeTemplates(): void {
    this.templates = [
      {
        id: 'monthly_payroll_processing',
        name: 'Monthly Payroll Processing',
        description: 'Complete monthly payroll processing workflow with approvals and integrations',
        category: 'payroll_processing',
        version: '1.0',
        isActive: true,
        steps: [
          {
            id: 'collect_timesheet_data',
            name: 'Collect Timesheet Data',
            type: 'action',
            status: 'pending',
            order: 1,
            dependencies: [],
            actions: [{
              type: 'sync_data',
              parameters: { source: 'timesheet_system', dataType: 'time_entries' }
            }],
            retryCount: 0,
            maxRetries: 3,
            approvalRequired: false
          },
          {
            id: 'validate_employee_data',
            name: 'Validate Employee Data',
            type: 'validation',
            status: 'pending',
            order: 2,
            dependencies: ['collect_timesheet_data'],
            actions: [{
              type: 'calculate_payroll',
              parameters: { validationOnly: true }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'calculate_gross_pay',
            name: 'Calculate Gross Pay',
            type: 'calculation',
            status: 'pending',
            order: 3,
            dependencies: ['validate_employee_data'],
            actions: [{
              type: 'calculate_payroll',
              parameters: { step: 'gross_pay' }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'calculate_deductions',
            name: 'Calculate Statutory Deductions',
            type: 'calculation',
            status: 'pending',
            order: 4,
            dependencies: ['calculate_gross_pay'],
            actions: [{
              type: 'calculate_payroll',
              parameters: { step: 'deductions' }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'payroll_review',
            name: 'Payroll Review & Approval',
            type: 'approval',
            status: 'pending',
            order: 5,
            dependencies: ['calculate_deductions'],
            actions: [{
              type: 'create_approval',
              parameters: { 
                title: 'Monthly Payroll Approval',
                assignedTo: ['payroll_manager', 'finance_director'],
                priority: 'high'
              }
            }],
            retryCount: 0,
            maxRetries: 1,
            approvalRequired: true,
            timeout: 48 * 60 * 60 * 1000 // 48 hours
          },
          {
            id: 'generate_payslips',
            name: 'Generate Pay Slips',
            type: 'action',
            status: 'pending',
            order: 6,
            dependencies: ['payroll_review'],
            actions: [{
              type: 'generate_report',
              parameters: { reportType: 'payslips', format: 'pdf' }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'process_payments',
            name: 'Process Bank Payments',
            type: 'integration',
            status: 'pending',
            order: 7,
            dependencies: ['generate_payslips'],
            actions: [{
              type: 'send_payment',
              parameters: { provider: 'equity_bank', batchSize: 100 }
            }],
            retryCount: 0,
            maxRetries: 3,
            approvalRequired: false
          },
          {
            id: 'submit_compliance',
            name: 'Submit Compliance Reports',
            type: 'integration',
            status: 'pending',
            order: 8,
            dependencies: ['process_payments'],
            actions: [{
              type: 'sync_data',
              parameters: { 
                targets: ['kra_itax', 'nssf_portal', 'nhif_portal'],
                reportType: 'monthly_returns'
              }
            }],
            retryCount: 0,
            maxRetries: 3,
            approvalRequired: false
          },
          {
            id: 'notify_completion',
            name: 'Notify Stakeholders',
            type: 'notification',
            status: 'pending',
            order: 9,
            dependencies: ['submit_compliance'],
            actions: [{
              type: 'send_notification',
              parameters: {
                recipients: ['hr_team', 'finance_team', 'management'],
                template: 'payroll_completion_notification'
              }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          }
        ],
        triggers: [{
          type: 'schedule',
          schedule: {
            frequency: 'monthly',
            time: '09:00',
            dayOfMonth: 25
          }
        }],
        variables: {
          payrollPeriod: '',
          totalEmployees: 0,
          totalGrossPay: 0,
          approvalDeadline: ''
        },
        createdBy: 'system',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      },
      {
        id: 'quarterly_compliance_reporting',
        name: 'Quarterly Compliance Reporting',
        description: 'Automated quarterly compliance reporting to government agencies',
        category: 'compliance',
        version: '1.0',
        isActive: true,
        steps: [
          {
            id: 'gather_quarterly_data',
            name: 'Gather Quarterly Data',
            type: 'action',
            status: 'pending',
            order: 1,
            dependencies: [],
            actions: [{
              type: 'sync_data',
              parameters: { period: 'quarterly', dataTypes: ['payroll', 'deductions', 'payments'] }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'validate_compliance_data',
            name: 'Validate Compliance Data',
            type: 'validation',
            status: 'pending',
            order: 2,
            dependencies: ['gather_quarterly_data'],
            actions: [{
              type: 'calculate_payroll',
              parameters: { validationType: 'compliance', period: 'quarterly' }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'generate_compliance_reports',
            name: 'Generate Compliance Reports',
            type: 'action',
            status: 'pending',
            order: 3,
            dependencies: ['validate_compliance_data'],
            actions: [{
              type: 'generate_report',
              parameters: { 
                reportTypes: ['p9_forms', 'paye_returns', 'nssf_returns'],
                format: 'pdf'
              }
            }],
            retryCount: 0,
            maxRetries: 2,
            approvalRequired: false
          },
          {
            id: 'compliance_approval',
            name: 'Compliance Review & Approval',
            type: 'approval',
            status: 'pending',
            order: 4,
            dependencies: ['generate_compliance_reports'],
            actions: [{
              type: 'create_approval',
              parameters: {
                title: 'Quarterly Compliance Reports Approval',
                assignedTo: ['compliance_officer', 'finance_director'],
                priority: 'high'
              }
            }],
            retryCount: 0,
            maxRetries: 1,
            approvalRequired: true,
            timeout: 72 * 60 * 60 * 1000 // 72 hours
          },
          {
            id: 'submit_to_authorities',
            name: 'Submit to Government Authorities',
            type: 'integration',
            status: 'pending',
            order: 5,
            dependencies: ['compliance_approval'],
            actions: [{
              type: 'sync_data',
              parameters: {
                targets: ['kra_itax', 'nssf_portal'],
                submissionType: 'quarterly'
              }
            }],
            retryCount: 0,
            maxRetries: 3,
            approvalRequired: false
          }
        ],
        triggers: [{
          type: 'schedule',
          schedule: {
            frequency: 'quarterly',
            time: '10:00',
            dayOfMonth: 15
          }
        }],
        variables: {
          quarter: '',
          year: 0,
          submissionDeadline: ''
        },
        createdBy: 'system',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    ];
  }

  /**
   * Get all workflow templates
   */
  static getTemplates(): WorkflowTemplate[] {
    if (this.templates.length === 0) {
      this.initializeTemplates();
    }
    return this.templates;
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): WorkflowTemplate | null {
    return this.getTemplates().find(template => template.id === id) || null;
  }

  /**
   * Create workflow instance from template
   */
  static async createWorkflowInstance(
    templateId: string,
    triggeredBy: string,
    triggerType: string,
    context: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Workflow template not found');
    }

    const instance: WorkflowInstance = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      status: 'pending',
      startTime: new Date().toISOString(),
      currentStep: template.steps[0]?.id,
      completedSteps: [],
      failedSteps: [],
      context: { ...template.variables, ...context },
      triggeredBy,
      triggerType,
      progress: 0,
      logs: []
    };

    this.instances.push(instance);
    this.logWorkflowEvent(instance.id, 'workflow_created', 'info', 'Workflow instance created');

    return instance;
  }

  /**
   * Execute workflow instance
   */
  static async executeWorkflow(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const template = this.getTemplate(instance.templateId);
    if (!template) {
      throw new Error('Workflow template not found');
    }

    instance.status = 'running';
    this.logWorkflowEvent(instanceId, 'workflow_started', 'info', 'Workflow execution started');

    try {
      for (const step of template.steps.sort((a, b) => a.order - b.order)) {
        // Check dependencies
        const dependenciesMet = step.dependencies.every(dep => 
          instance.completedSteps.includes(dep)
        );

        if (!dependenciesMet) {
          this.logWorkflowEvent(instanceId, step.id, 'warning', 'Step skipped - dependencies not met');
          continue;
        }

        // Check conditions
        if (step.conditions && !this.evaluateConditions(step.conditions, instance.context)) {
          this.logWorkflowEvent(instanceId, step.id, 'info', 'Step skipped - conditions not met');
          continue;
        }

        // Execute step
        await this.executeStep(instance, step);

        // Update progress
        instance.progress = (instance.completedSteps.length / template.steps.length) * 100;
      }

      instance.status = 'completed';
      instance.endTime = new Date().toISOString();
      instance.duration = new Date(instance.endTime).getTime() - new Date(instance.startTime).getTime();
      
      this.logWorkflowEvent(instanceId, 'workflow_completed', 'info', 'Workflow execution completed successfully');

    } catch (error) {
      instance.status = 'failed';
      instance.endTime = new Date().toISOString();
      this.logWorkflowEvent(instanceId, 'workflow_failed', 'error', `Workflow execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Execute individual workflow step
   */
  private static async executeStep(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const stepStartTime = new Date().toISOString();
    step.status = 'running';
    step.startTime = stepStartTime;
    instance.currentStep = step.id;

    this.logWorkflowEvent(instance.id, step.id, 'info', `Executing step: ${step.name}`);

    try {
      // Handle approval steps
      if (step.approvalRequired) {
        await this.createApprovalRequest(instance, step);
        step.status = 'pending';
        this.logWorkflowEvent(instance.id, step.id, 'info', 'Approval request created - waiting for approval');
        return; // Workflow will resume when approval is granted
      }

      // Execute step actions
      for (const action of step.actions) {
        await this.executeAction(instance, step, action);
      }

      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
      
      instance.completedSteps.push(step.id);
      this.logWorkflowEvent(instance.id, step.id, 'info', `Step completed successfully in ${step.duration}ms`);

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date().toISOString();
      step.errorMessage = error.toString();
      step.retryCount++;

      instance.failedSteps.push(step.id);
      this.logWorkflowEvent(instance.id, step.id, 'error', `Step failed: ${error}`);

      // Retry logic
      if (step.retryCount < step.maxRetries) {
        this.logWorkflowEvent(instance.id, step.id, 'info', `Retrying step (attempt ${step.retryCount + 1}/${step.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        await this.executeStep(instance, step);
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute workflow action
   */
  private static async executeAction(
    instance: WorkflowInstance,
    step: WorkflowStep,
    action: WorkflowAction
  ): Promise<void> {
    this.logWorkflowEvent(instance.id, step.id, 'debug', `Executing action: ${action.type}`);

    // Simulate action execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    switch (action.type) {
      case 'calculate_payroll':
        // Simulate payroll calculation
        instance.context.calculationResults = {
          totalEmployees: 234,
          totalGrossPay: 15750000,
          totalDeductions: 4725000,
          totalNetPay: 11025000
        };
        break;

      case 'send_notification':
        // Simulate notification sending
        this.logWorkflowEvent(instance.id, step.id, 'info', 
          `Notification sent to: ${action.parameters.recipients?.join(', ')}`);
        break;

      case 'sync_data':
        // Simulate data synchronization
        const success = Math.random() > 0.1; // 90% success rate
        if (!success) {
          throw new Error('Data synchronization failed');
        }
        break;

      case 'generate_report':
        // Simulate report generation
        instance.context.generatedReports = action.parameters.reportTypes || ['payroll_summary'];
        break;

      case 'send_payment':
        // Simulate payment processing
        const paymentSuccess = Math.random() > 0.05; // 95% success rate
        if (!paymentSuccess) {
          throw new Error('Payment processing failed');
        }
        instance.context.paymentResults = {
          processedCount: 230,
          failedCount: 4,
          totalAmount: instance.context.calculationResults?.totalNetPay || 0
        };
        break;

      default:
        this.logWorkflowEvent(instance.id, step.id, 'warning', `Unknown action type: ${action.type}`);
    }
  }

  /**
   * Create approval request
   */
  private static async createApprovalRequest(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const approvalAction = step.actions.find(a => a.type === 'create_approval');
    if (!approvalAction) return;

    const approval: ApprovalRequest = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowInstanceId: instance.id,
      stepId: step.id,
      title: approvalAction.parameters.title || step.name,
      description: approvalAction.parameters.description || `Approval required for ${step.name}`,
      requestedBy: instance.triggeredBy,
      assignedTo: approvalAction.parameters.assignedTo || [],
      status: 'pending',
      priority: approvalAction.parameters.priority || 'medium',
      dueDate: new Date(Date.now() + (step.timeout || 24 * 60 * 60 * 1000)).toISOString(),
      createdDate: new Date().toISOString(),
      data: instance.context
    };

    this.approvalRequests.push(approval);
    this.logWorkflowEvent(instance.id, step.id, 'info', `Approval request created: ${approval.id}`);
  }

  /**
   * Process approval response
   */
  static async processApproval(
    approvalId: string,
    approved: boolean,
    respondedBy: string,
    comments?: string
  ): Promise<void> {
    const approval = this.approvalRequests.find(a => a.id === approvalId);
    if (!approval) {
      throw new Error('Approval request not found');
    }

    approval.status = approved ? 'approved' : 'rejected';
    approval.respondedBy = respondedBy;
    approval.respondedDate = new Date().toISOString();
    approval.comments = comments;

    const instance = this.getInstance(approval.workflowInstanceId);
    if (!instance) return;

    if (approved) {
      // Continue workflow execution
      this.logWorkflowEvent(instance.id, approval.stepId, 'info', `Approval granted by ${respondedBy}`);
      
      // Mark step as completed and continue
      const template = this.getTemplate(instance.templateId);
      const step = template?.steps.find(s => s.id === approval.stepId);
      if (step) {
        step.status = 'completed';
        instance.completedSteps.push(step.id);
        
        // Continue with next steps
        await this.executeWorkflow(instance.id);
      }
    } else {
      // Reject workflow
      instance.status = 'failed';
      instance.endTime = new Date().toISOString();
      this.logWorkflowEvent(instance.id, approval.stepId, 'error', `Approval rejected by ${respondedBy}: ${comments}`);
    }
  }

  /**
   * Get workflow instance
   */
  static getInstance(id: string): WorkflowInstance | null {
    return this.instances.find(instance => instance.id === id) || null;
  }

  /**
   * Get all workflow instances
   */
  static getInstances(status?: string): WorkflowInstance[] {
    if (status) {
      return this.instances.filter(instance => instance.status === status);
    }
    return this.instances;
  }

  /**
   * Get pending approval requests
   */
  static getPendingApprovals(assignedTo?: string): ApprovalRequest[] {
    let approvals = this.approvalRequests.filter(a => a.status === 'pending');
    
    if (assignedTo) {
      approvals = approvals.filter(a => a.assignedTo.includes(assignedTo));
    }
    
    return approvals.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Evaluate workflow conditions
   */
  private static evaluateConditions(conditions: WorkflowCondition[], context: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = context[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return false;
      }
    });
  }

  /**
   * Log workflow event
   */
  private static logWorkflowEvent(
    instanceId: string,
    stepId: string,
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    data?: Record<string, any>
  ): void {
    const instance = this.getInstance(instanceId);
    if (!instance) return;

    const log: WorkflowLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      stepId,
      level,
      message,
      data
    };

    instance.logs.push(log);
    console.log(`[${level.toUpperCase()}] Workflow ${instanceId} - ${stepId}: ${message}`);
  }

  /**
   * Cancel workflow instance
   */
  static cancelWorkflow(instanceId: string, reason: string): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance || instance.status === 'completed') return false;

    instance.status = 'cancelled';
    instance.endTime = new Date().toISOString();
    this.logWorkflowEvent(instanceId, 'workflow_cancelled', 'info', `Workflow cancelled: ${reason}`);
    
    return true;
  }

  /**
   * Get workflow statistics
   */
  static getWorkflowStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    pendingApprovals: number;
    averageExecutionTime: number;
  } {
    const totalWorkflows = this.instances.length;
    const activeWorkflows = this.instances.filter(i => i.status === 'running').length;
    const completedWorkflows = this.instances.filter(i => i.status === 'completed').length;
    const failedWorkflows = this.instances.filter(i => i.status === 'failed').length;
    const pendingApprovals = this.approvalRequests.filter(a => a.status === 'pending').length;
    
    const completedWithDuration = this.instances.filter(i => i.status === 'completed' && i.duration);
    const averageExecutionTime = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, i) => sum + (i.duration || 0), 0) / completedWithDuration.length
      : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      failedWorkflows,
      pendingApprovals,
      averageExecutionTime
    };
  }

  /**
   * Schedule workflow triggers
   */
  static scheduleWorkflowTriggers(): void {
    // Check for scheduled workflows every hour
    setInterval(() => {
      const now = new Date();
      
      this.getTemplates().forEach(template => {
        template.triggers.forEach(trigger => {
          if (trigger.type === 'schedule' && trigger.schedule) {
            const shouldTrigger = this.shouldTriggerSchedule(trigger.schedule, now);
            
            if (shouldTrigger) {
              this.createWorkflowInstance(
                template.id,
                'system',
                'schedule',
                { scheduledTime: now.toISOString() }
              ).then(instance => {
                this.executeWorkflow(instance.id);
              }).catch(error => {
                console.error(`Failed to execute scheduled workflow ${template.id}:`, error);
              });
            }
          }
        });
      });
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Check if schedule should trigger
   */
  private static shouldTriggerSchedule(schedule: any, now: Date): boolean {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const scheduleTime = schedule.time.split(':');
    const scheduleHour = parseInt(scheduleTime[0]);
    const scheduleMinute = parseInt(scheduleTime[1]);

    // Check if current time matches schedule time (within 1 hour window)
    if (currentHour !== scheduleHour || Math.abs(currentMinute - scheduleMinute) > 30) {
      return false;
    }

    switch (schedule.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return now.getDay() === schedule.dayOfWeek;
      case 'monthly':
        return now.getDate() === schedule.dayOfMonth;
      case 'quarterly':
        const month = now.getMonth() + 1;
        return [1, 4, 7, 10].includes(month) && now.getDate() === schedule.dayOfMonth;
      default:
        return false;
    }
  }
}
