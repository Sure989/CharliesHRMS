import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/workflows
router.get('/', (req: Request, res: Response) => {
  // Return mock workflow data
  const mockWorkflows = [
    {
      id: '1',
      name: 'New Employee Onboarding',
      status: 'ACTIVE',
      currentStep: 3,
      totalSteps: 5,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'John Doe'
    },
    {
      id: '2',
      name: 'Expense Approval',
      status: 'PENDING_APPROVAL',
      currentStep: 2,
      totalSteps: 3,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Finance Team'
    }
  ];
  
  res.json({ status: 'success', data: mockWorkflows, message: 'Workflow mock data' });
});

// GET /api/approvals
router.get('/approvals', (req: Request, res: Response) => {
  // Return mock approval data
  const mockApprovals = [
    {
      id: '1',
      workflowId: '2',
      title: 'Expense Report #1234',
      requestedBy: 'Jane Smith',
      requestedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      priority: 'HIGH'
    }
  ];
  
  res.json({ status: 'success', data: mockApprovals, message: 'Approvals mock data' });
});

// GET /api/workflow-stats
router.get('/stats', (req: Request, res: Response) => {
  // Return mock workflow stats
  const mockStats = {
    totalWorkflows: 2,
    activeWorkflows: 1,
    completedWorkflows: 0,
    failedWorkflows: 0,
    pendingApprovals: 1,
    averageExecutionTime: 3600 // seconds
  };
  
  res.json({ status: 'success', data: mockStats, message: 'Workflow stats mock data' });
});

export default router;
