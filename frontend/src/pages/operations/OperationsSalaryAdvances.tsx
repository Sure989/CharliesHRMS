import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Check, X, Eye, DollarSign, Clock, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyCompact } from '@/utils/currency';
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service';
import { SalaryAdvanceRequest } from '@/types/types';
import { PayrollEngine } from '@/services/payrollEngine';
import { PayrollDataService } from '@/services/payrollDataService';
import { useAuth } from '@/contexts/AuthContext';

const OperationsSalaryAdvances = () => {
  const { toast } = useToast();
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvanceRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [advances, setAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollInfo, setPayrollInfo] = useState<any>(null);
  const { user } = useAuth();

  // Defensive mapping for backend data, adapted for ops manager
  const mapAdvance = (req: any) => ({
    id: req.id,
    employeeId: req.employeeId,
    employeeName: req.employeeName || (req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.employeeId || 'Unknown'),
    branch: req.employee?.branch?.name || req.branch || '',
    amount: req.requestedAmount || req.amount,
    status: req.status,
    reason: req.reason,
    hrEligibilityDetails: req.hrEligibilityDetails || {},
    repaymentDetails: req.repaymentDetails || {},
    workflowHistory: req.workflowHistory || [],
    disbursementMethod: req.disbursementMethod || '',
    opsManagerName: req.approver ? `${req.approver.firstName} ${req.approver.lastName}` : '',
    opsInitialDate: req.createdAt,
    opsInitialComments: '',
    hrReviewerName: '',
    hrReviewDate: '',
    hrDecision: '',
    hrComments: '',
    opsFinalDate: req.updatedAt,
    opsFinalComments: '',
    currentStep: req.status,
    payrollIntegration: req.payrollIntegration || {},
    requestDate: req.requestDate || req.createdAt || '',
  });

  // Helper to determine if a request is relevant for the ops manager (status and not own request)
  const isOpsManagerRelevantAdvance = (req: any, user: any) => {
    const status = (req.status || '').toLowerCase().replace(/\s|_/g, '').trim();
    const isRelevantStatus = status === 'pending' || status === 'pendingops' || status === 'pendingopsinitial' || status === 'pendingopreview' || status === 'forwardedtohr' || status === 'approved';
    const notOwnRequest = String(req.employeeId) !== String(user?.employeeId);
    // Exclude requests from employees with no branch assigned
    const hasBranch = req.employee?.branch?.id || req.branch?.id || req.employee?.branchId || req.branchId;
    return isRelevantStatus && notOwnRequest && !!hasBranch;
  };

  // Fetch all salary advance requests for operations manager
  useEffect(() => {
    const loadSalaryAdvanceRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await salaryAdvanceService.getSalaryAdvanceRequests(user?.branchId ? { department: 'operations', branchId: user.branchId } : { department: 'operations' });
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
        // Filter for ops manager relevant requests
        setAdvances(advancesArray.filter((apiReq: any) => isOpsManagerRelevantAdvance(apiReq, user)).map(mapAdvance));
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
    };
    loadSalaryAdvanceRequests();
  }, [toast, user]);

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

  // Approve/Reject handlers (ops manager workflow)
  const handleApproval = async (requestId: string, isApproved: boolean) => {
    // Prevent ops manager from approving their own request
    const selected = advances.find(r => String(r.id) === String(requestId));
    if (selected && String(selected.employeeId) === String(user?.employeeId)) {
      toast({
        title: "Not Allowed",
        description: "You cannot approve or reject your own salary advance request. It will be routed to HR.",
        variant: "destructive"
      });
      setIsViewDialogOpen(false);
      setReviewComments("");
      return;
    }
    try {
      if (isApproved) {
        await salaryAdvanceService.approveSalaryAdvanceRequest({
          requestId,
          approverId: user?.id,
          status: 'FORWARDEDTOHR',
          comments: reviewComments
        });
        toast({
          title: 'Advance Approved',
          description: 'Salary advance request has been approved and forwarded to HR.',
          variant: 'default',
        });
      } else {
        await salaryAdvanceService.rejectSalaryAdvanceRequest({
          requestId,
          approverId: user?.id,
          rejectionReason: reviewComments
        });
        toast({
          title: 'Advance Rejected',
          description: 'Salary advance request has been rejected.',
          variant: 'destructive',
        });
      }
      // Refresh list
      const response = await salaryAdvanceService.getSalaryAdvanceRequests(user?.branchId ? { department: 'operations', branchId: user.branchId } : { department: 'operations' });
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
      setAdvances(advancesArray.filter((apiReq: any) => isOpsManagerRelevantAdvance(apiReq, user)).map(mapAdvance));
      setSelectedAdvance(null);
      setIsViewDialogOpen(false);
      setReviewComments('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update salary advance request.',
        variant: 'destructive',
      });
    }
  };

  // Status badge helper (ops manager workflow)
  const normalizeStatus = (status: string) => (status || '').toLowerCase().replace(/\s|_/g, '').trim();
  // Show requests with status 'pendingopreview', 'forwardedtohr', 'rejected', or 'approved' in the ops manager table and badges
  const opsRelevantAdvances = advances.filter(r => {
    const norm = normalizeStatus(r.status);
    return norm === 'pendingopreview' || norm === 'forwardedtohr' || norm === 'rejected' || norm === 'approved';
  });
  const opsPendingRequests = opsRelevantAdvances.filter(r => normalizeStatus(r.status) === 'pendingopreview');
  const opsForwardedRequests = opsRelevantAdvances.filter(r => normalizeStatus(r.status) === 'forwardedtohr');
  const opsRejectedRequests = opsRelevantAdvances.filter(r => normalizeStatus(r.status) === 'rejected');
  const opsApprovedRequests = opsRelevantAdvances.filter(r => normalizeStatus(r.status) === 'approved');

  const getStatusBadge = (status: string) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'pendingopreview':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'forwardedtohr':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Forwarded to HR</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // UI
  if (loading) {
    return (
      <DashboardLayout title="Salary Advance Reviews - Operations">
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
    <DashboardLayout title="Salary Advance Reviews">
      <div className="space-y-6">
        {/* Dashboard Badges */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{opsPendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forwarded to HR</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{opsForwardedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Under HR review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{opsApprovedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Approved by HR</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{opsRejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Not eligible</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Review and manage salary advance requests for your team.</CardDescription>
          </CardHeader>
          <CardContent>
            {opsRelevantAdvances.length === 0 ? (
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
                  {opsRelevantAdvances.map((advance) => (
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
                        {normalizeStatus(advance.status) === 'pendingopreview' && (
                          <>
                            {String(advance.employeeId) === String(user?.employeeId) ? (
                              <span className="ml-2 text-xs text-muted-foreground">You cannot approve your own request. This will be routed to HR for review.</span>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 text-green-600 hover:text-green-700"
                                  onClick={() => { setSelectedAdvance(advance); setIsViewDialogOpen(true); }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 text-red-600 hover:text-red-700"
                                  onClick={() => { setSelectedAdvance(advance); setIsViewDialogOpen(true); }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
                    <p className="text-sm font-medium">{formatCurrencyCompact(selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0)}/month</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Advance Eligible</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(PayrollEngine.calculateMaxAdvanceLimit(selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0))} (50% of salary)</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Outstanding Advances</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(selectedAdvance.repaymentDetails?.remainingBalance || 0)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Available Credit</label>
                    <p className="text-sm font-medium">{formatCurrencyCompact(PayrollEngine.calculateAvailableCredit(selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0, selectedAdvance.repaymentDetails?.remainingBalance || 0))}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Reason</label>
                    <p className="text-sm font-medium">{selectedAdvance.reason}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground">Eligibility Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {(selectedAdvance.amount <= PayrollEngine.calculateMaxAdvanceLimit(selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0) && PayrollEngine.calculateAvailableCredit(selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0, selectedAdvance.repaymentDetails?.remainingBalance || 0) >= selectedAdvance.amount) ? (
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
                {normalizeStatus(selectedAdvance.status) === 'pendingopreview' && (
                  <div className="mt-4">
                    <label className="text-xs text-muted-foreground">Ops Manager Comments</label>
                    <Textarea
                      className="w-full border rounded p-2 mt-1 text-sm"
                      rows={3}
                      value={reviewComments}
                      onChange={e => setReviewComments(e.target.value)}
                      placeholder="Enter comments for approval or rejection (optional)"
                      disabled={String(selectedAdvance.employeeId) === String(user?.employeeId)}
                    />
                    <div className="flex gap-2 mt-2">
                      {String(selectedAdvance.employeeId) === String(user?.employeeId) ? (
                        <span className="text-xs text-muted-foreground">You cannot approve your own request. This will be routed to HR for review.</span>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 text-white"
                            onClick={() => handleApproval(String(selectedAdvance.id), true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white"
                            onClick={() => handleApproval(String(selectedAdvance.id), false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
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

export default OperationsSalaryAdvances;
