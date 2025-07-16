import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Check, X, Eye, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { leaveService } from '@/services/api/leave.service';
import { LeaveRequest } from '@/types/types';
// Update the import path if the file exists elsewhere, for example:
import { useAuth } from '@/contexts/AuthContext';
// Or correct the path as needed based on your project structure.

const OperationsLeaveApprovals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load leave requests from API
  useEffect(() => {
    const loadLeaveRequests = async () => {
      try {
        setLoading(true);
        const response = await leaveService.getLeaveRequests({ department: user?.branch ?? '' });
        const data = response.data || [];
        const requests = Array.isArray(data) ? data.map((apiReq: any) => ({
          id: apiReq.id,
          employeeId: apiReq.employeeId,
          employeeName: apiReq.employee?.firstName && apiReq.employee?.lastName ? `${apiReq.employee.firstName} ${apiReq.employee.lastName}` : '',
          branch: apiReq.employee?.department || '',
          leaveType: apiReq.leaveType?.name || '',
          startDate: apiReq.startDate,
          endDate: apiReq.endDate,
          days: apiReq.totalDays || 0,
          reason: apiReq.reason,
          status: apiReq.status,
          submissionDate: apiReq.appliedDate || apiReq.createdAt,
          opsManagerId: apiReq.approvedBy || '',
          opsManagerName: apiReq.approver ? `${apiReq.approver.firstName} ${apiReq.approver.lastName}` : '',
          opsInitialDate: apiReq.createdAt,
          opsInitialComments: '',
          hrReviewerId: '',
          hrReviewerName: '',
          hrReviewDate: '',
          hrDecision: '',
          hrComments: '',
          opsFinalDate: apiReq.updatedAt,
          opsFinalDecision: '',
          opsFinalComments: '',
          currentStep: apiReq.status,
          workflowHistory: [],
        })) : [];
        // Only show requests for employees with a branch matching the manager's branch
        const userBranch = user && user.branch != null ? (typeof user.branch === 'object' ? (user.branch as any).name : user.branch) : '';
        const filtered = userBranch ? requests.filter(r => r.branch && r.branch === userBranch) : [];
        setLeaveRequests(filtered);
      } catch (error) {
        console.error('Failed to load leave requests:', error);
        toast({
          title: "Error",
          description: "Failed to load leave requests from the server.",
          variant: "destructive"
        });
        setLeaveRequests([]);
      } finally {
        setLoading(false);
      }
    };
    loadLeaveRequests();
  }, [toast, user]);

  // Single correct approval handler for branch manager logic
  const handleApproval = async (requestId: string, approved: boolean) => {
    try {
      if (approved) {
        await leaveService.approveLeaveRequest({ requestId, approverId: user?.id, comments: approvalComments });
        setLeaveRequests(requests =>
          requests.map(request =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'ops_final_approved',
                  opsFinalDate: new Date().toISOString().split('T')[0],
                  opsFinalDecision: 'approved',
                  opsFinalComments: approvalComments || 'Approved by branch manager',
                  currentStep: 'completed'
                }
              : request
          )
        );
        toast({
          title: "Request Approved",
          description: "Leave request has been approved. The employee will be notified."
        });
      } else {
        await leaveService.rejectLeaveRequest({ requestId, approverId: user?.id, rejectionReason: approvalComments || 'Rejected by branch manager' });
        setLeaveRequests(requests =>
          requests.map(request =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'ops_final_rejected',
                  opsFinalDate: new Date().toISOString().split('T')[0],
                  opsFinalDecision: 'rejected',
                  opsFinalComments: approvalComments || 'Rejected by branch manager',
                  currentStep: 'completed'
                }
              : request
          )
        );
        toast({
          title: "Request Rejected",
          description: "Leave request has been rejected. The employee will be notified."
        });
      }
      setApprovalComments('');
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error('Failed to update leave request:', error);
      toast({
        title: "Error",
        description: "Failed to update leave request. Please try again.",
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
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      annual: 'bg-blue-500',
      sick: 'bg-red-500',
      personal: 'bg-purple-500',
      maternity: 'bg-pink-500',
      emergency: 'bg-orange-500'
    };
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-500'}>{type}</Badge>;
  };

  const pendingInitialRequests = leaveRequests.filter(r => r.status === 'pending_ops_initial');
  // Remove HR and final approval states for ops manager
  const forwardedRequests: LeaveRequest[] = [];
  const pendingFinalRequests: LeaveRequest[] = [];
  const completedRequests = leaveRequests.filter(r => r.status === 'ops_final_approved' || r.status === 'ops_final_rejected');

  if (loading) {
    return (
      <DashboardLayout title="Leave Approvals - Operations">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading leave requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leave Approvals - Operations">
      <div className="space-y-6">
        <div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Initial Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingInitialRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{completedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Final decisions made</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests - Operations Review</CardTitle>
            <CardDescription>Team leave requests requiring operations review and approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{request.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.startDate).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">to {new Date(request.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          request.currentStep === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span>Ops</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending_ops_initial' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(request.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleApproval(request.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {/* Only show Approve/Reject for pending_ops_initial, nothing for other statuses */}
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
              <DialogTitle>Leave Request Details</DialogTitle>
              <DialogDescription>
                {selectedRequest && `${selectedRequest.employeeName} - ${selectedRequest.leaveType} Leave`}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="text-sm">{selectedRequest.employeeName} ({selectedRequest.employeeId})</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Leave Type</Label>
                    <div className="mt-1">{getLeaveTypeBadge(selectedRequest.leaveType)}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Days</Label>
                    <p className="text-sm">{selectedRequest.days} days</p>
                  </div>
                  <div>
                    <Label>Submitted Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.submissionDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <p className="text-sm mt-1">{selectedRequest.reason}</p>
                </div>

                {/* Operations Review */}
                {selectedRequest.opsManagerName && (
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Operations Review</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                        <p className="text-sm font-medium">{selectedRequest.opsManagerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Review Date</Label>
                        <p className="text-sm font-medium">
                          {selectedRequest.opsInitialDate ? new Date(selectedRequest.opsInitialDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    {selectedRequest.opsInitialComments && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Operations Comments</Label>
                        <p className="text-sm">{selectedRequest.opsInitialComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* HR Review */}
                {selectedRequest.hrReviewerName && (
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">HR Review</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                        <p className="text-sm font-medium">{selectedRequest.hrReviewerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Review Date</Label>
                        <p className="text-sm font-medium">
                          {selectedRequest.hrReviewDate ? new Date(selectedRequest.hrReviewDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Decision</Label>
                        <p className="text-sm font-medium">
                          {selectedRequest.hrDecision === 'eligible' ? '✓ Eligible' : '✗ Not Eligible'}
                        </p>
                      </div>
                    </div>
                    {selectedRequest.hrComments && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">HR Comments</Label>
                        <p className="text-sm">{selectedRequest.hrComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Decision */}
                {selectedRequest.opsFinalDate && (
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Final Decision</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Decision Date</Label>
                        <p className="text-sm font-medium">
                          {new Date(selectedRequest.opsFinalDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Decision</Label>
                        <p className="text-sm font-medium">
                          {selectedRequest.opsFinalDecision === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </p>
                      </div>
                    </div>
                    {selectedRequest.opsFinalComments && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Final Comments</Label>
                        <p className="text-sm">{selectedRequest.opsFinalComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedRequest.status === 'pending_ops_initial' && (
                  <div className="border-t pt-4">
                    <Label htmlFor="comments">Comments (Optional)</Label>
                    <Textarea
                      id="comments"
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      placeholder="Add comments for this decision..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              {selectedRequest?.status === 'pending_ops_initial' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleApproval(selectedRequest.id, false)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproval(selectedRequest.id, true)}
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

export default OperationsLeaveApprovals;
