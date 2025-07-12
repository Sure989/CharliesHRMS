import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, ArrowRight, User, Users, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { workflowEngine, type WorkflowInstance, LEAVE_WORKFLOW, SALARY_ADVANCE_WORKFLOW } from '@/services/workflowEngine';

interface WorkflowStatusTrackerProps {
  workflowId?: string;
  type: 'leave' | 'salary_advance';
  status: string;
  className?: string;
}

export const WorkflowStatusTracker = ({ workflowId, type, status, className }: WorkflowStatusTrackerProps) => {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null);

  useEffect(() => {
    if (workflowId) {
      const workflowInstance = workflowEngine.getWorkflow(workflowId);
      setWorkflow(workflowInstance);
    }
  }, [workflowId]);

  const getWorkflowSteps = () => {
    return type === 'leave' ? LEAVE_WORKFLOW : SALARY_ADVANCE_WORKFLOW;
  };

  const getStepIcon = (stepId: string, isCompleted: boolean, isCurrent: boolean, isRejected: boolean) => {
    if (isRejected) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isCurrent) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'employee':
        return <User className="h-4 w-4" />;
      case 'operations':
        return <Users className="h-4 w-4" />;
      case 'hr':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_ops':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved_ops':
        return 'bg-blue-100 text-blue-800';
      case 'pending_hr':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'rejected_ops':
        return 'bg-red-100 text-red-800';
      case 'disbursed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    const steps = getWorkflowSteps();
    const currentStepIndex = steps.findIndex(step => 
      workflow ? step.id === workflow.currentStep : step.id === 'submit'
    );
    
    if (status === 'rejected' || status === 'rejected_ops') {
      return Math.max(0, (currentStepIndex / steps.length) * 100);
    }
    
    return Math.min(100, ((currentStepIndex + 1) / steps.length) * 100);
  };

  const steps = getWorkflowSteps();
  const progress = calculateProgress();
  const isRejected = status === 'rejected' || status === 'rejected_ops';

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Workflow Status</CardTitle>
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>
          Track the progress of your {type.replace('_', ' ')} request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className={`h-2 ${isRejected ? '[&>div]:bg-red-500' : ''}`}
          />
        </div>

        <Separator />

        {/* Workflow Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = workflow 
              ? workflow.history.some(h => h.stepId === step.id && h.action !== 'reject')
              : false;
            const isCurrent = workflow 
              ? workflow.currentStep === step.id
              : step.id === 'submit';
            const isStepRejected = workflow 
              ? workflow.history.some(h => h.stepId === step.id && h.action === 'reject')
              : false;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getStepIcon(step.id, isCompleted, isCurrent, isStepRejected)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.name}
                    </p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {getRoleIcon(step.role)}
                      <span className="text-xs capitalize">{step.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {workflow && workflow.history.find(h => h.stepId === step.id) && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">
                        {workflow.history.find(h => h.stepId === step.id)?.performedBy} • {' '}
                        {new Date(workflow.history.find(h => h.stepId === step.id)?.performedAt || '').toLocaleDateString()}
                      </p>
                      {workflow.history.find(h => h.stepId === step.id)?.comments && (
                        <p className="text-xs text-muted-foreground mt-1">
                          "{workflow.history.find(h => h.stepId === step.id)?.comments}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {index < steps.length - 1 && !isRejected && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Status Message */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">
            {isRejected ? (
              <span className="text-red-600 font-medium">
                Request has been rejected
              </span>
            ) : workflow?.currentStep === 'completed' ? (
              <span className="text-green-600 font-medium">
                Request has been completed successfully
              </span>
            ) : (
              <span>
                Currently with <span className="font-medium capitalize">
                  {workflow?.assignedTo?.replace('_', ' ') || 'Operations'}
                </span> for review
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowStatusTracker;
