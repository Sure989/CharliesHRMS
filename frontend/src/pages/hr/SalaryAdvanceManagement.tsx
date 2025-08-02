import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyCompact } from '@/utils/currency';
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service';
import { SalaryAdvanceRequest } from '@/types/types';
import { PayrollEngine } from '@/services/payrollEngine';
import { PayrollDataService } from '@/services/payrollDataService';
const SalaryAdvanceManagement: React.FC = () => {
  const { toast } = useToast();
  const [advances, setAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvanceRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [hrComments, setHrComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [payrollInfo, setPayrollInfo] = useState<any>(null);

  // Defensive mapping for backend data
  const mapAdvance = (req: any) => ({
    id: req.id,
    employeeId: req.employeeId,
    employeeName: req.employeeName || (req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.employeeId || 'Unknown'),
    branch: req.employee?.branch?.name || req.branch || '',
    amount: req.requestedAmount || req.amount,
    status: req.status,
    requestDate: req.requestDate || req.createdAt,
    reason: req.reason,
    hrEligibilityDetails: req.hrEligibilityDetails || {},
    repaymentDetails: req.repaymentDetails || {},
    workflowHistory: req.workflowHistory || [],
    ...req
  });

  // Fetch all salary advance requests for HR
  const loadSalaryAdvanceRequests = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await salaryAdvanceService.getSalaryAdvanceRequests();
      let advancesArray: any[] = [];
      if (Array.isArray(response?.data)) {
        advancesArray = response.data;
      } else if (
        response?.data &&
        typeof response.data === 'object' &&
        'requests' in response.data &&
        Array.isArray((response.data as any).requests)
      ) {
        advancesArray = (response.data as any).requests;
      } else if (
        response &&
        typeof response === 'object' &&
        'requests' in response &&
        Array.isArray((response as any).requests)
      ) {
        advancesArray = (response as any).requests;
      } else {
        advancesArray = [];
      }
      setAdvances(advancesArray.map(mapAdvance));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load salary advance requests.',
        variant: 'destructive',
      });
      setAdvances([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSalaryAdvanceRequests();
  }, [loadSalaryAdvanceRequests]);

  // Fetch payroll info for selected employee
  useEffect(() => {
    const fetchPayrollInfo = async () => {
      if (selectedAdvance) {
        try {
          const employee = await PayrollDataService.getEmployeePayrollInfo(String(selectedAdvance.employeeId));
          setPayrollInfo(employee?.payrollInfo || null);
        } catch {
          setPayrollInfo(null);
        }
      }
    };
    fetchPayrollInfo();
  }, [selectedAdvance]);

  // Approve/Reject handlers
  const handleApproval = async (requestId: string, isApproved: boolean) => {
    try {
      setActionLoading(true);
      if (isApproved) {
        await salaryAdvanceService.approveSalaryAdvanceRequest({
          requestId,
          approverId: undefined, // Set approverId if available from context
          status: 'APPROVED',
          comments: hrComments
        });
      } else {
        await salaryAdvanceService.rejectSalaryAdvanceRequest({
          requestId,
          approverId: undefined, // Set approverId if available from context
          rejectionReason: hrComments
        });
      }
      toast({
        title: isApproved ? "Advance Approved" : "Advance Rejected",
        description: `Salary advance request has been ${isApproved ? "approved" : "rejected"} successfully.`,
        variant: isApproved ? "default" : "destructive"
      });
      // Refresh list
      const response = await salaryAdvanceService.getSalaryAdvanceRequests();
      const advancesArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray((response as any)?.requests)
          ? (response as any).requests
          : [];
      setAdvances(advancesArray.map(mapAdvance));
      setSelectedAdvance(null);
      setIsViewDialogOpen(false);
      setHrComments('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update salary advance request.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Dashboard badge counts
  const normalizeStatus = (status: string) => (status || '').toLowerCase().replace(/\s|_/g, '').trim();
  // Log all status values for debugging
  React.useEffect(() => {
    if (advances.length > 0) {
       
      console.log('Salary Advance Statuses:', advances.map(a => a.status));
    }
  }, [advances]);

  // Only show requests forwarded to HR as pending for HR, and filter advances to only those relevant for HR
  const hrRelevantAdvances = advances.filter(r => 
    normalizeStatus(r.status) === 'forwardedtohr' || 
    normalizeStatus(r.status) === 'pendinghreview' ||
    normalizeStatus(r.status) === 'approved' || 
    normalizeStatus(r.status) === 'rejected'
  );
  const hrPendingRequests = hrRelevantAdvances.filter(r => 
    normalizeStatus(r.status) === 'forwardedtohr' || 
    normalizeStatus(r.status) === 'pendinghreview'
  );
  const hrApprovedRequests = hrRelevantAdvances.filter(r => normalizeStatus(r.status) === 'approved');
  const hrRejectedRequests = hrRelevantAdvances.filter(r => normalizeStatus(r.status) === 'rejected');

  // Details dialog calculations
  const monthlySalary = useMemo(() => {
    if (!selectedAdvance) return 0;
    return selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0;
  }, [selectedAdvance, payrollInfo]);
  const maxAdvanceLimit = useMemo(() => PayrollEngine.calculateMaxAdvanceLimit(monthlySalary), [monthlySalary]);
  const outstandingAdvances = selectedAdvance?.repaymentDetails?.remainingBalance || 0;
  const availableCredit = useMemo(() => PayrollEngine.calculateAvailableCredit(monthlySalary, outstandingAdvances), [monthlySalary, outstandingAdvances]);
  const isEligible = selectedAdvance ? (selectedAdvance.amount <= maxAdvanceLimit && availableCredit >= selectedAdvance.amount) : false;

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'forwardedtohr':
      case 'pendinghreview':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending HR Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">HR Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">HR Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Salary Advance Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading salary advance requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Salary Advance Management">
      <div className="space-y-6">
        {/* Dashboard Badges */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending HR Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{hrPendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{hrApprovedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Eligible</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{hrRejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Not eligible</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Salary Advance Requests</CardTitle>
            <CardDescription>Review and manage all salary advance requests from employees.</CardDescription>
          </CardHeader>
          <CardContent>
            {hrRelevantAdvances.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No salary advance requests found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hrRelevantAdvances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>{advance.employeeName}</TableCell>
                      <TableCell>{advance.branch}</TableCell>
                      <TableCell>{formatCurrencyCompact(advance.amount)}</TableCell>
                      <TableCell>{getStatusBadge(advance.status)}</TableCell>
                      <TableCell>{advance.requestDate ? new Date(advance.requestDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedAdvance(advance); setIsViewDialogOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {normalizeStatus(advance.status) === 'forwardedtohr' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 text-green-600 hover:text-green-700"
                              disabled={actionLoading}
                              onClick={() => { setSelectedAdvance(advance); setIsViewDialogOpen(true); }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 text-red-600 hover:text-red-700"
                              disabled={actionLoading}
                              onClick={() => { setSelectedAdvance(advance); setIsViewDialogOpen(true); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View/Review Dialog */}
        <Dialog open={isViewDialogOpen && !!selectedAdvance} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Salary Advance Details</DialogTitle>
              <DialogDescription>
                {selectedAdvance && `${selectedAdvance.employeeName} - ${formatCurrencyCompact(selectedAdvance.amount)}`}
              </DialogDescription>
            </DialogHeader>
            {selectedAdvance && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Branch</label>
                    <p className="text-sm font-medium">{selectedAdvance.branch}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Requested On</label>
                    <p className="text-sm font-medium">{selectedAdvance.requestDate ? new Date(selectedAdvance.requestDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Current Salary</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(monthlySalary)}/month</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Advance Eligible</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(maxAdvanceLimit)} (50% of salary)</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Outstanding Advances</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(outstandingAdvances)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Available Credit</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(availableCredit)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Reason</label>
                    <p className="text-sm font-medium">{selectedAdvance.reason}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground">Eligibility Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {isEligible ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Eligible for salary advance
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" /> Exceeds credit limit
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground">Repayment Details</label>
                  <div className="text-xs">
                    <div>Original Amount: {formatCurrencyCompact(selectedAdvance.repaymentDetails?.originalAmount || 0)}</div>
                    <div>Total Deducted: {formatCurrencyCompact(selectedAdvance.repaymentDetails?.totalDeducted || 0)}</div>
                    <div>Remaining Balance: {formatCurrencyCompact(selectedAdvance.repaymentDetails?.remainingBalance || 0)}</div>
                    <div>Repayment Method: {selectedAdvance.repaymentDetails?.repaymentMethod || '-'}</div>
                  </div>
                </div>
                {/* Workflow History (if available) */}
                {selectedAdvance.workflowHistory && selectedAdvance.workflowHistory.length > 0 && (
                  <div className="mt-3">
                    <label className="text-xs text-muted-foreground">Workflow History</label>
                    <ul className="text-xs mt-1 space-y-1">
                      {selectedAdvance.workflowHistory.map((step: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-medium">{step.stepName || step.status || 'Step'}:</span> {step.actorName || step.actor || ''} {step.date ? `on ${new Date(step.date).toLocaleDateString()}` : ''} {step.comments ? `- ${step.comments}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Approve/Reject actions */}
                {normalizeStatus(selectedAdvance.status) === 'forwardedtohr' && (
                  <div className="mt-4">
                    <label className="text-xs text-muted-foreground">HR Comments</label>
                    <Textarea
                      className="w-full border rounded p-2 mt-1 text-sm"
                      rows={3}
                      value={hrComments}
                      onChange={e => setHrComments(e.target.value)}
                      placeholder="Enter comments for approval or rejection (optional)"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="bg-green-600 text-white"
                        disabled={actionLoading}
                        onClick={() => handleApproval(String(selectedAdvance.id), true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white"
                        disabled={actionLoading}
                        onClick={() => handleApproval(String(selectedAdvance.id), false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SalaryAdvanceManagement;
