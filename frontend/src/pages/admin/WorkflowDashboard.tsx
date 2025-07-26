import { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getDashboardMetricsWebSocketUrl } from '@/services/api/websocket.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Clock,
  CheckCircle, Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/services/api';

// Returns an icon component based on workflow type
function getWorkflowTypeIcon(type: string) {
  switch (type) {
    case 'leave':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'salary_advance':
      return <DollarSign className="h-4 w-4 text-green-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
}

const WorkflowDashboard = () => {
  const [leaveWorkflows, setLeaveWorkflows] = useState([]);
  const [salaryAdvanceWorkflows, setSalaryAdvanceWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        
        const leaveRes = await api.leave.getLeaveRequests();
        const leaveData = leaveRes?.data?.leaveRequests || leaveRes?.data || [];
        
        const salaryRes = await api.salaryAdvances.getSalaryAdvanceRequests();
        const salaryData = salaryRes?.data?.requests || salaryRes?.data || [];
        
        const processedLeaveWorkflows = (Array.isArray(leaveData) ? leaveData : [])
          .filter((item: any) => ['pending', 'PENDING'].includes(item.status))
          .map((item: any) => ({
            id: item.id,
            type: 'leave',
            requestId: item.id,
            employeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Unknown Employee',
            currentStep: item.status,
            status: item.status,
            assignedTo: 'operations',
            createdAt: item.createdAt || item.appliedDate || new Date().toISOString(),
            updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
          }));
        
        const processedSalaryWorkflows = (Array.isArray(salaryData) ? salaryData : [])
          .filter((item: any) => ['pending', 'PENDING', 'FORWARDEDTOHR'].includes(item.status))
          .map((item: any) => ({
            id: item.id,
            type: 'salary_advance',
            requestId: item.id,
            employeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Unknown Employee',
            currentStep: item.status,
            status: item.status,
            assignedTo: item.status === 'FORWARDEDTOHR' ? 'hr' : 'operations',
            createdAt: item.createdAt || item.requestDate || new Date().toISOString(),
            updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
          }));
        
        setLeaveWorkflows(processedLeaveWorkflows);
        setSalaryAdvanceWorkflows(processedSalaryWorkflows);
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
        setLeaveWorkflows([]);
        setSalaryAdvanceWorkflows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, []);


  const workflows = useMemo(() => [...leaveWorkflows, ...salaryAdvanceWorkflows], [leaveWorkflows, salaryAdvanceWorkflows]);
  
  // Calculate stats from actual data
  const stats = useMemo(() => {
    const totalActive = workflows.filter(w => !['approved', 'rejected', 'disbursed'].includes(w.status)).length;
    const pendingOps = workflows.filter(w => w.assignedTo === 'operations').length;
    const pendingHR = workflows.filter(w => w.assignedTo === 'hr').length;
    const today = new Date().toDateString();
    const completedToday = workflows.filter(w => {
      const updated = new Date(w.updatedAt).toDateString();
      return ['approved', 'rejected', 'disbursed'].includes(w.status) && updated === today;
    }).length;
    
    return { totalActive, pendingOps, pendingHR, completedToday };
  }, [workflows]);

  // Helper functions and calculations
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  const getStartOfLastWeek = (date: Date) => {
    const startOfThisWeek = getStartOfWeek(date);
    return new Date(startOfThisWeek.setDate(startOfThisWeek.getDate() - 7));
  };
  const getCompletedInWeek = (workflows: any[], weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return workflows.filter(w => {
      const updated = new Date(w.updatedAt);
      return (
        ['approved', 'rejected', 'disbursed'].includes(w.status) &&
        updated >= weekStart && updated < weekEnd
      );
    });
  };
  const getAvgProcessingTimeFor = (workflows: any[]) => {
    if (!workflows.length) return 0;
    const totalMs = workflows.reduce((sum, w) => {
      const created = new Date(w.createdAt).getTime();
      const updated = new Date(w.updatedAt).getTime();
      return sum + Math.max(0, updated - created);
    }, 0);
    return totalMs / workflows.length / (1000 * 60 * 60 * 24);
  };
  const getApprovalRateFor = (workflows: any[]) => {
    if (!workflows.length) return 0;
    const approved = workflows.filter(w => w.status === 'approved' || w.status === 'disbursed').length;
    return Math.round((approved / workflows.length) * 100);
  };
  const overdueThresholdDays = 3;
  const overdueCount = workflows.filter(w => {
    if (['approved', 'rejected', 'disbursed'].includes(w.status)) return false;
    const created = new Date(w.createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > overdueThresholdDays;
  }).length;
  const now = new Date();
  const startOfThisWeek = getStartOfWeek(now);
  const startOfLastWeek = getStartOfLastWeek(now);
  const completedThisWeek = getCompletedInWeek(workflows, startOfThisWeek);
  const completedLastWeek = getCompletedInWeek(workflows, startOfLastWeek);
  const avgTimeThisWeek = getAvgProcessingTimeFor(completedThisWeek);
  const avgTimeLastWeek = getAvgProcessingTimeFor(completedLastWeek);
  let percentFaster = 0;
  if (avgTimeLastWeek > 0 && avgTimeThisWeek > 0) {
    percentFaster = Math.round(((avgTimeLastWeek - avgTimeThisWeek) / avgTimeLastWeek) * 100);
  }
  const approvalRate = getApprovalRateFor(workflows);
  const avgProcessingTime = getAvgProcessingTimeFor(workflows).toFixed(1);
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
        return 'bg-red-100 text-red-800';
      case 'disbursed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };
  const overviewStats = [
    {
      title: 'Active Workflows',
      value: stats.totalActive?.toString() || '0',
      description: 'Currently in progress',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Operations',
      value: stats.pendingOps?.toString() || '0',
      description: 'Awaiting ops review',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Pending HR',
      value: stats.pendingHR?.toString() || '0',
      description: 'Awaiting HR review (salary advance only)',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday?.toString() || '0',
      description: 'Approved, rejected, or disbursed today',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Workflow Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading workflows...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Workflow Management">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {overviewStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Workflows */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Workflows ({workflows.length})</TabsTrigger>
            <TabsTrigger value="leave">Leave Requests ({leaveWorkflows.length})</TabsTrigger>
            <TabsTrigger value="salary">Salary Advances ({salaryAdvanceWorkflows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Active Workflows</CardTitle>
                <CardDescription>Monitor all ongoing workflow processes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getWorkflowTypeIcon(workflow.type)}
                            <span className="capitalize">{workflow.type.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{workflow.employeeName}</div>
                            <div className="text-xs text-muted-foreground">#{workflow.requestId.slice(-8)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{workflow.currentStep.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{workflow.assignedTo?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTimeAgo(workflow.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {workflows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active workflows found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Request Workflows</CardTitle>
                <CardDescription>Track leave request processing</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveWorkflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell className="font-medium">#{workflow.requestId}</TableCell>
                        <TableCell className="capitalize">{workflow.currentStep.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{workflow.assignedTo?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTimeAgo(workflow.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {leaveWorkflows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active leave workflows found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary Advance Workflows</CardTitle>
                <CardDescription>Track salary advance processing</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryAdvanceWorkflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell className="font-medium">#{workflow.requestId}</TableCell>
                        <TableCell className="capitalize">{workflow.currentStep.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{workflow.assignedTo?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTimeAgo(workflow.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {salaryAdvanceWorkflows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active salary advance workflows found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workflow Insights */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Processing Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Week</span>
                  <span className="text-sm font-medium">{percentFaster > 0 ? `+${percentFaster}% faster` : percentFaster < 0 ? `${percentFaster}% slower` : 'No change'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Approval Rate</span>
                  <span className="text-sm font-medium">{approvalRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Processing Time</span>
                  <span className="text-sm font-medium">{avgProcessingTime} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Bottlenecks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">HR Review Queue</span>
                  <Badge variant="secondary">{stats.pendingHR} pending</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Operations Queue</span>
                  <Badge variant="secondary">{stats.pendingOps} pending</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overdue Reviews</span>
                  <Badge variant="destructive">{overdueCount} overdue</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkflowDashboard;
