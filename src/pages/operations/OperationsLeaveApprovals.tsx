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
import { api } from '@/services/unifiedApi';
import { LeaveRequest } from '@/types/types';

const OperationsLeaveApprovals = () => {
  const { toast } = useToast();
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
        const requests = await api.data.getLeaveRequests('operations');
        setLeaveRequests(requests);
      } catch (error) {
        console.error('Failed to load leave requests:', error);
        toast({
          title: "Error",
          description: "Failed to load leave requests from the server.",
          variant: "destructive"
        });
        setLeaveRequests([]); // No mock data fallback
      } finally {
        setLoading(false);
      }
    };

    loadLeaveRequests();
  }, [toast]);

  const handleApproval = async (requestId: string, approved: boolean) => {
    try {
      if (approved) {
        await api.data.approveLeaveRequest(requestId, 'operations', approvalComments);
        
        setLeaveRequests(requests => 
          requests.map(request => {
            if (request.id === requestId) {
              return {
                ...request,
                status: 'forwarded_to_hr',
                opsManagerName: 'Current Operations Manager',
                opsInitialDate: new Date().toISOString().split('T')[0],
                opsInitialComments: approvalComments || 'Approved by operations',
                currentStep: 'hr_review'
              };
            }
            return request;
          })
        );
        
        toast({
          title: "Request Approved",
          description: "Leave request has been approved and forwarded to HR for eligibility review."
        });
      } else {
        await api.data.rejectLeaveRequest(requestId, 'operations', approvalComments);
        
        setLeaveRequests(requests => 
          requests.map(request => {
            if (request.id === requestId) {
              return {
                ...request,
                status: 'ops_final_rejected',
                opsManagerName: 'Current Operations Manager',
                opsInitialDate: new Date().toISOString().split('T')[0],
                opsInitialComments: approvalComments || 'Rejected by operations',
                currentStep: 'completed'
              };
            }
            return request;
          })
        );
        
        toast({
          title: "Request Rejected",
          description: "Leave request has been rejected."
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

  const handleFinalApproval = async (requestId: string, approved: boolean) => {
    try {
      if (approved) {
        await api.data.approveLeaveRequest(requestId, 'operations', approvalComments);
        
        setLeaveRequests(requests => 
          requests.map(request => {
            if (request.id === requestId) {
              return {
                ...request,
                status: 'ops_final_approved',
                opsFinalDate: new Date().toISOString().split('T')[0],
                opsFinalDecision: 'approved',
                opsFinalComments: approvalComments || 'Final approval granted',
                currentStep: 'completed'
              };
            }
            return request;
          })
        );
        
        toast({
          title: "Final Approval Granted",
          description: "Leave request has been given final approval."
        });
      } else {
        await api.data.rejectLeaveRequest(requestId, 'operations', approvalComments);
        
        setLeaveRequests(requests => 
          requests.map(request => {
            if (request.id === requestId) {
              return {
                ...request,
                status: 'ops_final_rejected',
                opsFinalDate: new Date().toISOString().split('T')[0],
                opsFinalDecision: 'rejected',
                opsFinalComments: approvalComments || 'Final approval denied',
                currentStep: 'completed'
              };
            }
            return request;
          })
        );
        
        toast({
          title: "Final Approval Denied",
          description: "Leave request has been denied final approval."
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
  const forwardedRequests = leaveRequests.filter(r => r.status === 'forwarded_to_hr');
  const pendingFinalRequests = leaveRequests.filter(r => r.status === 'hr_approved');
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
          <h2 className="text-2xl font-bold">Operations Leave Management</h2>
          <p className="text-muted-foreground">Initial review and final approval of team leave requests</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
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
                  <TableHead>Branch</TableHead>
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
                    <TableCell>{request.branch}</TableCell>
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
                          request.currentStep !== 'ops_initial' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span>Ops</span>
                        <ArrowRight className="h-3 w-3" />
                        <div className={`w-2 h-2 rounded-full ${
                          request.currentStep === 'completed' ? 'bg-green-500' :
                          request.currentStep === 'ops_final' ? 'bg-yellow-500' :
                          request.currentStep === 'hr_review' ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                        <span>HR</span>
                        <ArrowRight className="h-3 w-3" />
                        <div className={`w-2 h-2 rounded-full ${
                          request.currentStep === 'completed' ? 'bg-green-500' :
                          request.currentStep === 'ops_final' ? 'bg-yellow-500' : 'bg-gray-300'
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
                        {request.status === 'hr_approved' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleFinalApproval(request.id, true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Final Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleFinalApproval(request.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Final Reject
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
              <DialogTitle>Leave Request Details</DialogTitle>
              <DialogDescription>
                {selectedRequest && `${selectedRequest.employeeName} - ${selectedRequest.leaveType} Leave`}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="text-sm">{selectedRequest.employeeName} ({selectedRequest.employeeId})</p>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <p className="text-sm">{selectedRequest.branch}</p>
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

                {(selectedRequest.status === 'pending_ops_initial' || selectedRequest.status === 'hr_approved') && (
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
                    Approve & Forward to HR
                  </Button>
                </>
              ) : selectedRequest?.status === 'hr_approved' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleFinalApproval(selectedRequest.id, false)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Final Reject
                  </Button>
                  <Button
                    onClick={() => handleFinalApproval(selectedRequest.id, true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Final Approve
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
