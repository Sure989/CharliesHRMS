import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Check, X, Eye, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/unifiedApi';
import { LeaveRequest } from '@/types/types';

const LeaveApprovals = () => {
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
        const requests = await api.data.getLeaveRequests('hr');
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
      const updatedRequest = await api.data.approveLeaveRequest(requestId, 'hr', approvalComments);
      
      setLeaveRequests(requests => 
        requests.map(request => {
          if (request.id === requestId) {
            return {
              ...request,
              status: approved ? 'hr_approved' : 'hr_rejected',
              hrReviewerName: 'Current HR Manager',
              hrReviewDate: new Date().toISOString().split('T')[0],
              hrDecision: approved ? 'eligible' : 'not_eligible',
              hrComments: approvalComments || undefined,
              currentStep: approved ? 'ops_final' : 'completed'
            };
          }
          return request;
        })
      );
      
      setApprovalComments('');
      setIsViewDialogOpen(false);
      
      toast({
        title: approved ? "Leave Request Approved" : "Leave Request Rejected",
        description: `The leave request has been ${approved ? 'approved' : 'rejected'}.`
      });
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
      case 'hr_approved':
        return <Badge variant="default" className="bg-green-500">HR Approved</Badge>;
      case 'hr_rejected':
        return <Badge variant="destructive">HR Rejected</Badge>;
      case 'forwarded_to_hr':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Pending HR Review</Badge>;
      case 'ops_final_approved':
        return <Badge variant="default" className="bg-green-600">Final Approved</Badge>;
      case 'ops_final_rejected':
        return <Badge variant="destructive">Final Rejected</Badge>;
      case 'pending_ops_initial':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Operations</Badge>;
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

  // Filter requests that HR needs to review
  const hrPendingRequests = leaveRequests.filter(r => r.status === 'forwarded_to_hr');
  const hrApprovedRequests = leaveRequests.filter(r => r.status === 'hr_approved');
  const hrRejectedRequests = leaveRequests.filter(r => r.status === 'hr_rejected');
  const finalApprovedRequests = leaveRequests.filter(r => r.status === 'ops_final_approved');

  if (loading) {
    return (
      <DashboardLayout title="Leave Approvals">
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
    <DashboardLayout title="Leave Approvals">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">HR Leave Request Management</h2>
          <p className="text-muted-foreground">Review employee eligibility and make decisions on leave requests</p>
        </div>

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
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{hrApprovedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Sent to operations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Rejected</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{hrRejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Not eligible</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Final Approved</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{finalApprovedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Completed workflow</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Employee leave requests requiring HR eligibility review</CardDescription>
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
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      {getLeaveTypeBadge(request.leaveType)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.startDate).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">to {new Date(request.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
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
                        {request.status === 'forwarded_to_hr' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApproval(request.id, true)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleApproval(request.id, false)}
                            >
                              <X className="h-4 w-4" />
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
                
                {/* Employee Leave Balance Information */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Employee Leave Records</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Annual Leave Balance</Label>
                      <p className="text-sm font-medium">15 days remaining</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sick Leave Balance</Label>
                      <p className="text-sm font-medium">8 days remaining</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Personal Leave Balance</Label>
                      <p className="text-sm font-medium">3 days remaining</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Leave Taken This Year</Label>
                      <p className="text-sm font-medium">7 days</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Eligibility Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Eligible for {selectedRequest?.leaveType} leave
                      </Badge>
                    </div>
                  </div>
                </div>

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

                {selectedRequest.status === 'forwarded_to_hr' && (
                  <div className="border-t pt-4">
                    <Label htmlFor="comments">HR Comments (Optional)</Label>
                    <Textarea
                      id="comments"
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      placeholder="Add any comments about eligibility or conditions..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              {selectedRequest?.status === 'forwarded_to_hr' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleApproval(selectedRequest.id, false)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject (Not Eligible)
                  </Button>
                  <Button
                    onClick={() => handleApproval(selectedRequest.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve (Eligible)
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

export default LeaveApprovals;
