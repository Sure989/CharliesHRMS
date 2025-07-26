import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertTriangle, XCircle, ArrowRight, DollarSign } from 'lucide-react';
import { leaveService } from '@/services/api/leave.service';
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service';
import { SalaryAdvanceRequest } from '@/types/types';
import { LeaveRequest, AdvancePayrollIntegration } from '@/types/types'; // Import other types from types.ts
import { useAuth } from '@/contexts/AuthContext';

const WorkflowTestDashboard = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [activeDeductions, setActiveDeductions] = useState<AdvancePayrollIntegration[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try { // Load data based on user role
      // Fetch leave requests and salary advances directly
      const leaveFilters = { employeeId: user.id };
      const salaryAdvanceFilters = { employeeId: user.id };
      const [leaveResp, advanceResp] = await Promise.all([
        leaveService.getLeaveRequests(leaveFilters),
        salaryAdvanceService.getSalaryAdvanceRequests(salaryAdvanceFilters)
      ]);
      setLeaveRequests((leaveResp.data || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employeeName ?? ((item.employee?.firstName ?? '') + ' ' + (item.employee?.lastName ?? '')),
        branch: item.branch ?? item.employee?.department ?? '',
        leaveType: item.leaveType?.name ?? item.leaveType ?? '',
        days: item.days ?? item.totalDays ?? 0,
        reason: item.reason ?? '',
        status: item.status ?? '',
        submissionDate: item.submissionDate ?? item.appliedDate ?? item.createdAt ?? '',
        currentStep: item.currentStep ?? '',
        workflowHistory: Array.isArray(item.workflowHistory) ? item.workflowHistory : [],
        startDate: item.startDate ?? '',
        endDate: item.endDate ?? ''
      })));
      setSalaryAdvances((advanceResp.data || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employeeName ?? ((item.employee?.firstName ?? '') + ' ' + (item.employee?.lastName ?? '')),
        branch: item.branch ?? item.employee?.department ?? '',
        amount: item.amount ?? item.requestedAmount ?? 0,
        reason: item.reason ?? '',
        requestDate: item.requestDate ?? item.createdAt ?? '',
        status: item.status ?? '',
        disbursementMethod: item.disbursementMethod ?? 'bank_transfer',
        currentStep: item.currentStep ?? '',
        payrollIntegration: item.payrollIntegration ?? {
          payrollDeductionId: '',
          monthlyDeduction: 0,
          repaymentMonths: 0,
          startDeductionDate: '',
          estimatedCompletionDate: '',
          deductionPriority: 1
        },
        repaymentDetails: item.repaymentDetails ?? {
          originalAmount: 0,
          totalDeducted: 0,
          remainingBalance: 0,
          repaymentMethod: '',
          deductionHistory: []
        },
        workflowHistory: Array.isArray(item.workflowHistory) ? item.workflowHistory : [],
        hrEligibilityDetails: item.hrEligibilityDetails ?? undefined,
        disbursedDate: item.disbursedDate ?? '',
        disbursedBy: item.disbursedBy ?? ''
      })));
      // For active deductions, you may need to implement a direct call or mock as needed
      setActiveDeductions([]); // Placeholder, implement if backend supports
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [user, loadData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'forwarded_to_hr':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'hr_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'hr_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ops_final_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ops_final_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'disbursed':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return 'bg-yellow-100 text-yellow-800';
      case 'forwarded_to_hr':
        return 'bg-blue-100 text-blue-800';
      case 'hr_approved':
        return 'bg-green-100 text-green-800';
      case 'hr_rejected':
        return 'bg-red-100 text-red-800';
      case 'ops_final_approved':
        return 'bg-green-100 text-green-900';
      case 'ops_final_rejected':
        return 'bg-red-100 text-red-900';
      case 'disbursed':
        return 'bg-emerald-100 text-emerald-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleLeaveAction = async (requestId: string, action: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      switch (action) {
        case 'forward_to_hr':
          await leaveService.bulkApproveLeaveRequests([requestId], user.id);
          break;
        case 'hr_approve':
          await leaveService.bulkApproveLeaveRequests([requestId], user.id);
          break;
        case 'hr_reject':
          // TODO: Implement rejectLeaveRequest in leaveService if needed
          // await leaveService.rejectLeaveRequest({ requestId, approverId: user.id, rejectionReason: 'Employee not eligible for leave' });
          await leaveService.getLeaveRequests({ employeeId: user.id });
          break;
        case 'ops_approve':
          await leaveService.bulkApproveLeaveRequests([requestId], user.id);
          break;
        case 'ops_reject':
          await leaveService.getLeaveRequests({ employeeId: user.id });
          break;
      }
      await loadData();
    } catch (error) {
      console.error('Error processing leave action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryAdvanceAction = async (requestId: number | string, action: string) => {
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

  const simulatePayrollDeduction = async (salaryAdvanceId: number | string) => {
    setLoading(true);
    try {
      // Implement processAdvanceDeduction if available in salaryAdvanceService, else skip or mock
      // await salaryAdvanceService.processAdvanceDeduction(salaryAdvanceId, 'PP-2024-12', 2500);
      await loadData();
    } catch (error) {
      console.error('Error processing payroll deduction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = (request: LeaveRequest | SalaryAdvanceRequest, type: 'leave' | 'advance') => {
    const actions = [];
    
    if (user?.role === 'OPERATIONS_MANAGER') {
      if (request.status === 'pending_ops_initial') {
        actions.push({ key: 'forward_to_hr', label: 'Forward to HR', variant: 'default' as const });
      }
      if (request.status === 'hr_approved') {
        actions.push({ key: 'ops_approve', label: 'Approve', variant: 'default' as const });
        actions.push({ key: 'ops_reject', label: 'Reject', variant: 'destructive' as const });
      }
      if (request.status === 'hr_rejected') {
        actions.push({ key: 'ops_reject', label: 'Reject', variant: 'destructive' as const });
      }
      if (type === 'advance' && request.status === 'ops_final_approved') {
        actions.push({ key: 'disburse', label: 'Disburse', variant: 'default' as const });
      }
    }
    
    if (user?.role === 'HR_MANAGER') {
      if (request.status === 'forwarded_to_hr') {
        actions.push({ key: 'hr_approve', label: 'Approve Eligibility', variant: 'default' as const });
        actions.push({ key: 'hr_reject', label: 'Reject Eligibility', variant: 'destructive' as const });
      }
    }
    
    return actions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading workflow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Test Dashboard</h2>
          <p className="text-muted-foreground">
            Test interconnectivity between leave requests, salary advances, and payroll integration
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          Refresh Data
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Workflow Testing Environment</AlertTitle>
        <AlertDescription>
          This dashboard demonstrates the corrected workflow where Operations Managers forward requests to HR for eligibility checks, 
          then make final decisions based on HR feedback. Salary advances automatically integrate with payroll for deductions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="leave" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leave">Leave Requests ({leaveRequests.length})</TabsTrigger>
          <TabsTrigger value="advances">Salary Advances ({salaryAdvances.length})</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Integration ({activeDeductions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Request Workflow</CardTitle>
              <CardDescription>
                Employee → Operations Manager → HR (Eligibility) → Operations Manager (Final Decision)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaveRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No leave requests found</p>
              ) : (
                leaveRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium">{request.employeeName}</span>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {request.days} days • {request.leaveType}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Dates:</strong> {request.startDate} to {request.endDate}</p>
                      <p><strong>Reason:</strong> {request.reason}</p>
                      <p><strong>Current Step:</strong> {request.currentStep.replace(/_/g, ' ')}</p>
                    </div>

                    {request.workflowHistory.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <h4 className="text-sm font-medium">Workflow History:</h4>
                        {request.workflowHistory.map((step, index) => (
                          <div key={step.id ?? index} className="text-xs bg-muted p-2 rounded">
                            <span className="font-medium">{step.actorName}</span> {step.action} 
                            <span className="text-muted-foreground ml-1">
                              ({new Date(step.timestamp).toLocaleString()})
                            </span>
                            {step.comments && <p className="mt-1 italic">"{step.comments}"</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {getAvailableActions(request, 'leave').map((action) => (
                        <Button
                          key={action.key}
                          size="sm"
                          variant={action.variant}
                          onClick={() => handleLeaveAction(request.id, action.key)}
                          disabled={loading}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary Advance Workflow</CardTitle>
              <CardDescription>
                Employee → Operations Manager → HR (Eligibility) → Operations Manager (Final Decision) → Disbursement → Payroll Integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {salaryAdvances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No salary advance requests found</p>
              ) : (
                salaryAdvances.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium">{request.employeeName}</span>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        KSH {request.amount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Reason:</strong> {request.reason}</p>
                      <p><strong>Current Step:</strong> {request.currentStep.replace(/_/g, ' ')}</p>
                      <p><strong>Repayment:</strong> KSH {request.payrollIntegration.monthlyDeduction.toLocaleString()}/month for {request.payrollIntegration.repaymentMonths} months</p>
                      {request.repaymentDetails.remainingBalance > 0 && (
                        <p><strong>Remaining Balance:</strong> KSH {request.repaymentDetails.remainingBalance.toLocaleString()}</p>
                      )}
                    </div>

                    {request.hrEligibilityDetails && (
                      <div className="bg-blue-50 p-3 rounded text-sm">
                        <h4 className="font-medium mb-2">HR Eligibility Assessment:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span>Current Salary: KSH {request.hrEligibilityDetails.currentSalary.toLocaleString()}</span>
                          <span>Max Allowable: KSH {request.hrEligibilityDetails.maxAllowableAdvance.toLocaleString()}</span>
                          <span>Employment Tenure: {request.hrEligibilityDetails.employmentTenure} months</span>
                          <span>Creditworthiness: {request.hrEligibilityDetails.creditworthiness}</span>
                        </div>
                      </div>
                    )}

                    {request.workflowHistory.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <h4 className="text-sm font-medium">Workflow History:</h4>
                        {request.workflowHistory.map((step) => (
                          <div key={step.id} className="text-xs bg-muted p-2 rounded">
                            <span className="font-medium">{step.actorName}</span> {step.action} 
                            <span className="text-muted-foreground ml-1">
                              ({new Date(step.timestamp).toLocaleString()})
                            </span>
                            {step.comments && <p className="mt-1 italic">"{step.comments}"</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {getAvailableActions(request, 'advance').map((action) => (
                        <Button
                          key={action.key}
                          size="sm"
                          variant={action.variant}
                          onClick={() => handleSalaryAdvanceAction(request.id, action.key)}
                          disabled={loading}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Integration</CardTitle>
              <CardDescription>
                Active salary advance deductions that will be processed during payroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeDeductions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active payroll deductions found</p>
              ) : (
                activeDeductions.map((deduction) => (
                  <div key={`${deduction.salaryAdvanceId}-${deduction.employeeId}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Advance #{deduction.salaryAdvanceId}</span>
                        <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Employee ID: {deduction.employeeId}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Monthly Deduction:</strong> KSH {deduction.monthlyDeductionAmount.toLocaleString()}</p>
                        <p><strong>Remaining Balance:</strong> KSH {deduction.remainingBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p><strong>Start Date:</strong> {deduction.startDate}</p>
                        <p><strong>Priority:</strong> {deduction.priority}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => simulatePayrollDeduction(deduction.salaryAdvanceId)}
                        disabled={loading}
                      >
                        Simulate Payroll Deduction
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowTestDashboard;
