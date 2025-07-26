  // Debug: Track component renders
  console.log('[DEBUG] WorkflowDashboard rendered');
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw, User } from 'lucide-react'
import { leaveService } from '@/services/api/leave.service'
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service'
import { LeaveRequest, SalaryAdvanceRequest } from '@/types/types'
import { useAuth } from '@/contexts/AuthContext'

// Fix badge array typing
interface BadgeItem {
  key: string;
  label: string;
  variant: "default" | "destructive" | "outline" | "secondary";
}

interface WorkflowDashboardProps {
  className?: string;
}

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('leave');
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Properly typed badge arrays
  const leaveStatusBadges: BadgeItem[] = [
    { key: 'pending_ops_initial', label: 'Pending Operations Review', variant: 'default' },
    { key: 'forwarded_to_hr', label: 'Forwarded to HR', variant: 'default' },
    { key: 'hr_rejected', label: 'HR Rejected', variant: 'destructive' },
    { key: 'hr_approved', label: 'HR Approved', variant: 'destructive' },
    { key: 'ops_final_approved', label: 'Final Approved', variant: 'default' },
    { key: 'ops_final_rejected', label: 'Final Rejected', variant: 'destructive' }
  ];

  const salaryAdvanceStatusBadges: BadgeItem[] = [
    { key: 'pending_ops_initial', label: 'Pending Operations Review', variant: 'default' },
    { key: 'forwarded_to_hr', label: 'Forwarded to HR', variant: 'default' },
    { key: 'hr_rejected', label: 'HR Rejected', variant: 'destructive' },
    { key: 'hr_approved', label: 'HR Approved', variant: 'destructive' },
    { key: 'ops_final_approved', label: 'Final Approved', variant: 'default' },
    { key: 'disbursed', label: 'Disbursed', variant: 'default' },
    { key: 'ops_final_rejected', label: 'Final Rejected', variant: 'destructive' }
  ];

  // Retry logic for network errors
  const loadData = useCallback(async (showLoading = false, retries = 2) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // Fetch leave requests
      // Use UUID for API requests
      const leaveFilters = { employeeId: user.employeeId };
      const salaryAdvanceFilters = { employeeId: user.employeeId };
      const [leaveResp, advanceResp] = await Promise.all([
        leaveService.getLeaveRequests(leaveFilters),
        salaryAdvanceService.getSalaryAdvanceRequests(salaryAdvanceFilters)
      ]);
      setLeaveRequests((leaveResp.data || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employeeName || item.employee?.firstName + ' ' + item.employee?.lastName || '',
        branch: item.branch || item.employee?.department || '',
        leaveType: item.leaveType?.name || item.leaveType || '',
        days: item.days || item.totalDays || 0,
        reason: item.reason,
        status: item.status,
        submissionDate: item.submissionDate || item.appliedDate || item.createdAt,
        currentStep: item.currentStep || '',
        workflowHistory: item.workflowHistory || [],
        startDate: item.startDate,
        endDate: item.endDate
      })));
      setSalaryAdvances((advanceResp.data || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employeeName || item.employee?.firstName + ' ' + item.employee?.lastName || '',
        branch: item.branch || item.employee?.department || '',
        amount: item.amount || item.requestedAmount || 0,
        reason: item.reason,
        requestDate: item.requestDate || item.createdAt,
        status: item.status,
        disbursementMethod: item.disbursementMethod || 'bank_transfer',
        currentStep: item.currentStep || '',
        payrollIntegration: item.payrollIntegration || {
          payrollDeductionId: '',
          monthlyDeduction: 0,
          repaymentMonths: 0,
          startDeductionDate: '',
          estimatedCompletionDate: '',
          deductionPriority: 1
        },
        repaymentDetails: item.repaymentDetails || {
          originalAmount: 0,
          totalDeducted: 0,
          remainingBalance: 0,
          repaymentMethod: '',
          deductionHistory: []
        },
        workflowHistory: item.workflowHistory || [],
        hrEligibilityDetails: item.hrEligibilityDetails || undefined,
        disbursedDate: item.disbursedDate,
        disbursedBy: item.disbursedBy
      })));
    } catch (err: any) {
      if (err?.code === 'ERR_NETWORK' && retries > 0) {
        // Wait 2 seconds before retrying
        setTimeout(() => loadData(showLoading, retries - 1), 2000);
        return;
      }
      if (err?.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check your network connection or try again later.');
      } else {
        setError('Failed to load data. Please try again.');
      }
      console.error('Error loading data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  // Polling effect
  useEffect(() => {
    if (!user) return;
    console.log('[DEBUG] Setting up polling interval for WorkflowDashboard');
    loadData(true); // Initial load with spinner
        pollingRef.current = setInterval(() => {
      console.log('[DEBUG] Polling WorkflowDashboard data');
      loadData(false); // Silent polling
        }, 300000); // Changed to 5 minutes
        return () => {
      console.log('[DEBUG] Clearing polling interval for WorkflowDashboard');
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, loadData]);

  const handleLeaveAction = async (requestId: string, action: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let decision: 'APPROVED' | 'REJECTED' | null = null;
      let reason = '';
      switch (action) {
        case 'forward_to_hr':
        case 'hr_approve':
        case 'ops_approve':
          decision = 'APPROVED';
          reason =
            action === 'forward_to_hr'
              ? 'Forwarding for eligibility review'
              : action === 'hr_approve'
              ? 'Employee is eligible for leave'
              : 'Final approval granted';
          break;
        case 'hr_reject':
        case 'ops_reject':
          decision = 'REJECTED';
          reason =
            action === 'hr_reject'
              ? 'Employee not eligible for leave'
              : 'Final approval denied';
          break;
      }
      if (decision) {
        await leaveService.decideLeaveRequest(requestId, decision, reason);
      }
      await loadData();
    } catch (error) {
      console.error('Error processing leave action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryAdvanceAction = async (requestId: number, action: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      switch (action) {
        case 'forward_to_hr':
          await salaryAdvanceService.approveSalaryAdvanceRequest({ requestId: String(requestId), approverId: user.id, comments: 'Forwarding for eligibility check' });
          break;
        case 'hr_approve':
          await salaryAdvanceService.approveSalaryAdvanceRequest({ requestId: String(requestId), approverId: user.id, comments: 'Employee eligible for advance', approvedAmount: undefined, repaymentMonths: undefined });
          break;
        case 'hr_reject':
          await salaryAdvanceService.rejectSalaryAdvanceRequest({ requestId: String(requestId), approverId: user.id, rejectionReason: 'Employee not eligible for advance' });
          break;
        case 'ops_approve':
          await salaryAdvanceService.approveSalaryAdvanceRequest({ requestId: String(requestId), approverId: user.id, comments: 'Final approval granted', approvedAmount: undefined, repaymentMonths: undefined });
          break;
        case 'ops_reject':
          await salaryAdvanceService.rejectSalaryAdvanceRequest({ requestId: String(requestId), approverId: user.id, rejectionReason: 'Final approval denied' });
          break;
        case 'disburse':
          await salaryAdvanceService.disburseSalaryAdvance(String(requestId), { disbursedBy: user.id, disbursementMethod: 'bank_transfer' });
          break;
      }
      
      await loadData();
    } catch (error) {
      console.error('Error processing salary advance action:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: 'leave' | 'salary') => {
    const badges = type === 'leave' ? leaveStatusBadges : salaryAdvanceStatusBadges;
    const badge = badges.find(b => b.key === status);
    return badge || { key: status, label: status, variant: 'outline' as const };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return <Clock className="h-4 w-4" />;
      case 'forwarded_to_hr':
        return <RefreshCw className="h-4 w-4" />;
      case 'hr_approved':
      case 'ops_final_approved':
      case 'disbursed':
        return <CheckCircle className="h-4 w-4" />;
      case 'hr_rejected':
      case 'ops_final_rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Workflow Dashboard
          </CardTitle>
          <CardDescription>
            Manage leave requests and salary advances workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leave">Leave Requests</TabsTrigger>
              <TabsTrigger value="salary">Salary Advances</TabsTrigger>
            </TabsList>
            <TabsContent value="leave" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Leave Requests</h3>
                <Button 
                  onClick={() => loadData(true)} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
              </div>
              
              {leaveRequests.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Leave Requests</AlertTitle>
                  <AlertDescription>
                    There are no leave requests to display.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => {
                    const statusBadge = getStatusBadge(request.status, 'leave');
                    return (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                <span className="font-medium">{request.employeeName}</span>
                                <Badge 
                                  variant={statusBadge.variant}
                                  key={statusBadge.key}
                                >
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {request.leaveType} • {request.days} days • {request.startDate} to {request.endDate}
                              </p>
                              <p className="text-sm">{request.reason}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              {request.status === 'pending_ops_initial' && user?.role === 'OPERATIONS_MANAGER' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleLeaveAction(request.id, 'forward_to_hr')}
                                  disabled={loading}
                                >
                                  Forward to HR
                                </Button>
                              )}
                              
                              {request.status === 'forwarded_to_hr' && user?.role === 'HR_MANAGER' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleLeaveAction(request.id, 'hr_approve')}
                                    disabled={loading}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleLeaveAction(request.id, 'hr_reject')}
                                    disabled={loading}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {request.status === 'hr_approved' && user?.role === 'OPERATIONS_MANAGER' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleLeaveAction(request.id, 'ops_approve')}
                                    disabled={loading}
                                  >
                                    Final Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleLeaveAction(request.id, 'ops_reject')}
                                    disabled={loading}
                                  >
                                    Final Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="salary" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Salary Advances</h3>
                <Button 
                  onClick={() => loadData(true)} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
              </div>
              
              {salaryAdvances.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Salary Advances</AlertTitle>
                  <AlertDescription>
                    There are no salary advance requests to display.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {salaryAdvances.map((request) => {
                    const statusBadge = getStatusBadge(request.status, 'salary');
                    return (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                <span className="font-medium">{request.employeeName}</span>
                                <Badge 
                                  variant={statusBadge.variant}
                                  key={statusBadge.key}
                                >
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Amount: KES {request.amount.toLocaleString()} • Requested: {request.requestDate}
                              </p>
                              <p className="text-sm">{request.reason}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              {request.status === 'pending_ops_initial' && user?.role === 'OPERATIONS_MANAGER' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSalaryAdvanceAction(request.id, 'forward_to_hr')}
                                  disabled={loading}
                                >
                                  Forward to HR
                                </Button>
                              )}
                              
                              {request.status === 'forwarded_to_hr' && user?.role === 'HR_MANAGER' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSalaryAdvanceAction(request.id, 'hr_approve')}
                                    disabled={loading}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleSalaryAdvanceAction(request.id, 'hr_reject')}
                                    disabled={loading}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {request.status === 'hr_approved' && user?.role === 'OPERATIONS_MANAGER' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSalaryAdvanceAction(request.id, 'ops_approve')}
                                    disabled={loading}
                                  >
                                    Final Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleSalaryAdvanceAction(request.id, 'ops_reject')}
                                    disabled={loading}
                                  >
                                    Final Reject
                                  </Button>
                                </>
                              )}
                              
                              {request.status === 'ops_final_approved' && user?.role === 'ADMIN' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSalaryAdvanceAction(request.id, 'disburse')}
                                  disabled={loading}
                                >
                                  Disburse
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowDashboard;
