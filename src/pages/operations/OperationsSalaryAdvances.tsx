import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Check, X, Eye, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyCompact } from '@/utils/currency';
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service';
import { SalaryAdvanceRequest } from '@/types/types';
import { PayrollEngine } from '@/services/payrollEngine';
import { PayrollDataService } from '@/services/payrollDataService';

const OperationsSalaryAdvances = () => {
  const { toast } = useToast();
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvanceRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [advances, setAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollInfo, setPayrollInfo] = useState<any>(null); // Add state for payroll info

  // Load salary advance requests from API
  useEffect(() => {
    const loadSalaryAdvanceRequests = async () => {
      try {
        setLoading(true);
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({ department: 'operations' });
        // Defensive: handle both { data: [] } and { requests: [] }
        const advancesArray = Array.isArray(response?.data)
          ? response.data
          : Array.isArray((response as any)?.requests)
            ? (response as any).requests
            : [];

        const advances = advancesArray.map((apiReq: any) => ({
          id: apiReq.id,
          employeeId: apiReq.employeeId,
          employeeName: apiReq.employee?.firstName && apiReq.employee?.lastName ? `${apiReq.employee.firstName} ${apiReq.employee.lastName}` : '',
          branch: apiReq.employee?.department || '',
          amount: apiReq.requestedAmount,
          disbursementMethod: apiReq.disbursementMethod || '',
          reason: apiReq.reason,
          status: apiReq.status,
          requestDate: apiReq.requestDate || apiReq.createdAt,
          opsManagerName: apiReq.approver ? `${apiReq.approver.firstName} ${apiReq.approver.lastName}` : '',
          opsInitialDate: apiReq.createdAt,
          opsInitialComments: '',
          hrReviewerName: '',
          hrReviewDate: '',
          hrDecision: '',
          hrComments: '',
          opsFinalDate: apiReq.updatedAt,
          opsFinalDecision: '',
          opsFinalComments: '',
          currentStep: apiReq.status,
          payrollIntegration: apiReq.payrollIntegration || {},
          repaymentDetails: apiReq.repaymentDetails || {},
          hrEligibilityDetails: apiReq.hrEligibilityDetails || {},
          workflowHistory: [] as import('@/types/types').WorkflowStep[],
        }));
        setAdvances(advances);
      } catch (error) {
        console.error('Failed to load salary advance requests:', error);
        toast({
          title: "Error",
          description: "Failed to load salary advance requests from the server.",
          variant: "destructive"
        });
        setAdvances([]); // No mock data fallback
      } finally {
        setLoading(false);
      }
    };

    loadSalaryAdvanceRequests();
  }, [toast]);

  // Fetch payroll info when selectedAdvance changes
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

  const handleApproval = async (advanceId: number, approved: boolean) => {
    try {
      if (approved) {
        await salaryAdvanceService.approveSalaryAdvanceRequest({ requestId: String(advanceId), approverId: 'operations', comments: reviewComments });
        setAdvances(prev => prev.map(advance => 
          advance.id === advanceId 
            ? { 
                ...advance, 
                status: 'forwarded_to_hr',
                opsManagerName: 'Current Operations Manager',
                opsInitialDate: new Date().toISOString().split('T')[0],
                opsInitialComments: reviewComments || 'Approved by operations and forwarded to HR',
                currentStep: 'hr_review'
              }
            : advance
        ));
        toast({
          title: "Request Approved",
          description: "Salary advance request has been approved and forwarded to HR for eligibility review."
        });
      } else {
        await salaryAdvanceService.rejectSalaryAdvanceRequest({ requestId: String(advanceId), approverId: 'operations', rejectionReason: reviewComments });
        setAdvances(prev => prev.map(advance => 
          advance.id === advanceId 
            ? { 
                ...advance, 
                status: 'ops_final_rejected',
                opsManagerName: 'Current Operations Manager',
                opsInitialDate: new Date().toISOString().split('T')[0],
                opsInitialComments: reviewComments || 'Rejected by operations',
                currentStep: 'completed'
              }
            : advance
        ));
        toast({
          title: "Request Rejected",
          description: "Salary advance request has been rejected."
        });
      }

      setReviewComments('');
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error('Failed to update salary advance request:', error);
      toast({
        title: "Error",
        description: "Failed to update salary advance request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFinalApproval = async (advanceId: number, approved: boolean) => {
    try {
      if (approved) {
        await salaryAdvanceService.approveSalaryAdvanceRequest({ requestId: String(advanceId), approverId: 'operations', comments: reviewComments });
        setAdvances(prev => prev.map(advance => 
          advance.id === advanceId 
            ? { 
                ...advance, 
                status: 'ops_final_approved',
                opsFinalDate: new Date().toISOString().split('T')[0],
                opsFinalDecision: 'approved',
                opsFinalComments: reviewComments || 'Final approval granted',
                currentStep: 'completed'
              }
            : advance
        ));
        toast({
          title: "Final Approval Granted",
          description: "Salary advance request has been given final approval and is ready for disbursement."
        });
      } else {
        await salaryAdvanceService.rejectSalaryAdvanceRequest({ requestId: String(advanceId), approverId: 'operations', rejectionReason: reviewComments });
        setAdvances(prev => prev.map(advance => 
          advance.id === advanceId 
            ? { 
                ...advance, 
                status: 'ops_final_rejected',
                opsFinalDate: new Date().toISOString().split('T')[0],
                opsFinalDecision: 'rejected',
                opsFinalComments: reviewComments || 'Final approval denied',
                currentStep: 'completed'
              }
            : advance
        ));
        toast({
          title: "Final Approval Denied",
          description: "Salary advance request has been denied final approval."
        });
      }

      setReviewComments('');
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error('Failed to update salary advance request:', error);
      toast({
        title: "Error",
        description: "Failed to update salary advance request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return <Badge variant="outline" className="text-orange-600">Pending Ops Review</Badge>;
      case 'forwarded_to_hr':
        return <Badge className="bg-blue-500">Forwarded to HR</Badge>;
      case 'hr_approved':
        return <Badge className="bg-green-500">HR Approved</Badge>;
      case 'hr_rejected':
        return <Badge variant="destructive">HR Rejected</Badge>;
      case 'ops_final_approved':
        return <Badge className="bg-green-600">Final Approved</Badge>;
      case 'ops_final_rejected':
        return <Badge variant="destructive">Final Rejected</Badge>;
      case 'disbursed':
        return <Badge className="bg-emerald-500">Disbursed</Badge>;
      case 'repaying':
        return <Badge className="bg-purple-500">Repaying</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  const pendingInitialRequests = advances.filter(a => a.status === 'pending_ops_initial');
  const forwardedRequests = advances.filter(a => a.status === 'forwarded_to_hr');
  const pendingFinalRequests = advances.filter(a => a.status === 'hr_approved');
  const completedRequests = advances.filter(a => a.status === 'ops_final_approved' || a.status === 'ops_final_rejected');

  const totalPendingAmount = pendingInitialRequests.reduce((sum, req) => sum + req.amount, 0);

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
    <DashboardLayout title="Salary Advance Reviews - Operations">
      <div className="space-y-6">
        <div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Initial Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingInitialRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrencyCompact(totalPendingAmount)} total value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forwarded to HR</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{forwardedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Under HR review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Final Approval</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{pendingFinalRequests.length}</div>
              <p className="text-xs text-muted-foreground">HR approved, awaiting final decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{completedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Final decisions made</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Salary Advance Requests - Operations Review</CardTitle>
            <CardDescription>Team salary advance requests requiring operations review and approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((advance) => (
                  <TableRow key={advance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{advance.employeeName}</div>
                        <div className="text-sm text-muted-foreground">ID: {advance.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrencyCompact(advance.amount)}</TableCell>
                    <TableCell className="max-w-xs truncate">{advance.reason}</TableCell>
                    <TableCell>{new Date(advance.requestDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(advance.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          advance.currentStep !== 'ops_initial' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span>Ops</span>
                        <ArrowRight className="h-3 w-3" />
                        <div className={`w-2 h-2 rounded-full ${
                          advance.currentStep === 'completed' ? 'bg-green-500' :
                          advance.currentStep === 'ops_final' ? 'bg-yellow-500' :
                          advance.currentStep === 'hr_review' ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                        <span>HR</span>
                        <ArrowRight className="h-3 w-3" />
                        <div className={`w-2 h-2 rounded-full ${
                          advance.currentStep === 'completed' ? 'bg-green-500' :
                          advance.currentStep === 'ops_final' ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                        <span>Final</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAdvance(advance);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {advance.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(advance.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleApproval(advance.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Request Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Salary Advance Request Details</DialogTitle>
              <DialogDescription>
                {selectedAdvance && `${selectedAdvance.employeeName} - ${formatCurrencyCompact(selectedAdvance.amount)}`}
              </DialogDescription>
            </DialogHeader>
                    {selectedAdvance && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label>Employee</Label>
                            <p className="text-sm">{selectedAdvance.employeeName} (ID: {selectedAdvance.employeeId})</p>
                          </div>
                        </div>
                        
                        {/* Employee Salary Information */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-3">
                          {(() => {
                            // Get employee info
                            const monthlySalary = selectedAdvance?.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0;
                            
                            // Calculate max advance and available credit
                            const maxAdvanceLimit = PayrollEngine.calculateMaxAdvanceLimit(monthlySalary);
                            const outstandingAdvances = selectedAdvance?.repaymentDetails?.remainingBalance || 0;
                            const availableCredit = PayrollEngine.calculateAvailableCredit(monthlySalary, outstandingAdvances);
                            
                            return (
                              <>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Current Salary</Label>
                                  <p className="text-sm font-medium">{formatCurrencyCompact(monthlySalary)}/month</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Max Advance Eligible</Label>
                                  <p className="text-sm font-medium">{formatCurrencyCompact(maxAdvanceLimit)}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Outstanding Advances</Label>
                                  <p className="text-sm font-medium">{formatCurrencyCompact(outstandingAdvances)}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Available Credit</Label>
                                  <p className="text-sm font-medium">{formatCurrencyCompact(availableCredit)}</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <p className="text-sm">{formatCurrencyCompact(selectedAdvance.amount)}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedAdvance.status)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Repayment Period</Label>
                    <p className="text-sm">{selectedAdvance.payrollIntegration.repaymentMonths} months</p>
                  </div>
                  <div>
                    <Label>Monthly Deduction</Label>
                    <p className="text-sm">{formatCurrencyCompact(selectedAdvance.payrollIntegration.monthlyDeduction)}</p>
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <p className="text-sm mt-1">{selectedAdvance.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Request Date</Label>
                    <p className="text-sm">{new Date(selectedAdvance.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Disbursement Method</Label>
                    <p className="text-sm">{selectedAdvance.disbursementMethod.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {/* Operations Review */}
                {selectedAdvance.opsManagerName && (
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Operations Review</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                        <p className="text-sm font-medium">{selectedAdvance.opsManagerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Review Date</Label>
                        <p className="text-sm font-medium">
                          {selectedAdvance.opsInitialDate ? new Date(selectedAdvance.opsInitialDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    {selectedAdvance.opsInitialComments && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Operations Comments</Label>
                        <p className="text-sm">{selectedAdvance.opsInitialComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* HR Review */}
                {selectedAdvance.hrReviewerName && (
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">HR Review</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                        <p className="text-sm font-medium">{selectedAdvance.hrReviewerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Review Date</Label>
                        <p className="text-sm font-medium">
                          {selectedAdvance.hrReviewDate ? new Date(selectedAdvance.hrReviewDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Decision</Label>
                        <p className="text-sm font-medium">
                          {selectedAdvance.hrDecision === 'eligible' ? '✓ Eligible' : '✗ Not Eligible'}
                        </p>
                      </div>
                    </div>
                    {selectedAdvance.hrComments && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">HR Comments</Label>
                        <p className="text-sm">{selectedAdvance.hrComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Decision */}
                {selectedAdvance.opsFinalDate && (
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Final Decision</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Decision Date</Label>
                        <p className="text-sm font-medium">
                          {new Date(selectedAdvance.opsFinalDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Decision</Label>
                        <p className="text-sm font-medium">
                          {selectedAdvance.opsFinalDecision === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </p>
                      </div>
                    </div>
                    {selectedAdvance.opsFinalComments && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Final Comments</Label>
                        <p className="text-sm">{selectedAdvance.opsFinalComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {(selectedAdvance.status === 'pending_ops_initial' || selectedAdvance.status === 'hr_approved') && (
                  <div className="border-t pt-4">
                    <Label htmlFor="comments">Review Comments (Optional)</Label>
                    <Textarea
                      id="comments"
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Add comments for this review..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              {selectedAdvance?.status === 'PENDING' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleApproval(selectedAdvance.id, false)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproval(selectedAdvance.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OperationsSalaryAdvances;
