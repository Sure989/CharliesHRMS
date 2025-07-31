// Type guard to check if leaveType is a non-null object
function isLeaveTypeObject(leaveType: unknown): leaveType is { code: string; name: string } {
  return (
    typeof leaveType === 'object' &&
    leaveType !== null &&
    'code' in leaveType &&
    'name' in leaveType &&
    typeof (leaveType as any).code === 'string' &&
    typeof (leaveType as any).name === 'string'
  );
}

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
import { leaveService } from '@/services/api/leave.service';
import { LeaveRequest } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';

const OperationsLeaveApprovals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaveRequests = async () => {
      setLoading(true);
      try {
        // Get branch info from user.branch, fallback to user.branchId/user.branchName if missing
        let userBranch = user?.branch as unknown as import('@/types/branch').Branch | undefined;
        let userBranchId = userBranch?.id;
        let userBranchName = userBranch?.name;
        if (!userBranchId && user?.branchId) userBranchId = user.branchId;
        if (!userBranchName && user?.branchName) userBranchName = user.branchName;
        if (!userBranchId && !userBranchName) {
          console.log('User object missing branch info:', user);
        }
        // Fetch all leave requests (do not filter by branchName in API call)
        const response = await leaveService.getLeaveRequests();
        const data = Array.isArray(response)
          ? response
          : Array.isArray((response as any)?.leaveRequests)
            ? (response as any).leaveRequests
            : Array.isArray((response as any)?.data?.leaveRequests)
              ? (response as any).data.leaveRequests
              : [];
        // Filter leave requests by branch manager's branch
        const filtered = Array.isArray(data)
          ? data.filter((r: any) => {
              if (r.employeeId === user?.employeeId) return false;
              const empBranch = r.employee?.branch;
              let match = false;
              if (userBranchId && (empBranch?.id === userBranchId || (r.branch && typeof r.branch === 'object' && r.branch.id === userBranchId))) {
                match = true;
              }
              const branchNameToUse = userBranchName || empBranch?.name;
              if (!match && branchNameToUse) {
                if (empBranch?.name && empBranch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) match = true;
                if (!match && r.branch) {
                  if (typeof r.branch === 'object' && r.branch.name && r.branch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) match = true;
                  if (!match && typeof r.branch === 'string' && r.branch.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) match = true;
                }
              }
              return match;
            })
          : [];
        // Map backend fields to LeaveRequest type
        const mapped = filtered
          .map((r: any) => {
            return {
              ...r,
              employeeName: r.employeeName || (r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : ''),
              branch: r.employee?.branch?.name || r.branch || '',
              leaveType: r.leaveTypeName || r.leaveType?.name || r.leaveType || '',
              startDate: r.startDate,
              endDate: r.endDate,
              days: r.days || r.totalDays,
              reason: r.reason,
              status: r.status,
              submissionDate: r.appliedAt || r.submissionDate,
              id: r.id,
              employeeId: r.employeeId,
              opsManagerId: r.opsManagerId,
              opsManagerName: r.opsManagerName,
              opsInitialDate: r.opsInitialDate,
              opsInitialComments: r.opsInitialComments,
              hrReviewerId: r.hrReviewerId,
              hrReviewerName: r.hrReviewerName,
              hrReviewDate: r.hrReviewDate,
              hrDecision: r.hrDecision,
              hrComments: r.hrComments,
              opsFinalDate: r.opsFinalDate,
              opsFinalDecision: r.opsFinalDecision,
              opsFinalComments: r.opsFinalComments,
              currentStep: r.currentStep ?? '',
              workflowHistory: r.workflowHistory ?? [],
            };
          })
          .filter((r: any) => r.status !== 'deleted' && r.status !== 'cancelled');
        setLeaveRequests(mapped);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load leave requests.", variant: "destructive" });
        setLeaveRequests([]);
      } finally {
        setLoading(false);
      }
    };
    loadLeaveRequests();
  }, [toast, user]);

  const handleApproval = async (requestId: string, isApproved: boolean) => {
    setLoading(true);
    try {
      // Prevent ops manager from approving their own leave requests
      const selected = leaveRequests.find(r => r.id === requestId);
      if (selected && selected.employeeId === user?.employeeId) {
        toast({
          title: "Not Allowed",
          description: "You cannot approve or reject your own leave request. It will be routed to HR.",
          variant: "destructive"
        });
        setIsViewDialogOpen(false);
        setApprovalComments("");
        setLoading(false);
        return;
      }
      await leaveService.decideLeaveRequest(
        requestId,
        isApproved ? 'APPROVED' : 'REJECTED',
        approvalComments
      );
      toast({
        title: isApproved ? "Leave Approved" : "Leave Rejected",
        description: `Leave request has been ${isApproved ? "approved" : "rejected"} successfully.`,
        variant: isApproved ? "default" : "destructive"
      });
      // Reload leave requests after action
      let userBranch = user?.branch as unknown as import('@/types/branch').Branch | undefined;
      let userBranchId = userBranch?.id;
      let userBranchName = userBranch?.name;
      if (!userBranchId && user?.branchId) userBranchId = user.branchId;
      if (!userBranchName && user?.branchName) userBranchName = user.branchName;
      const response = await leaveService.getLeaveRequests();
      const data = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.leaveRequests)
          ? (response as any).leaveRequests
          : Array.isArray((response as any)?.data?.leaveRequests)
            ? (response as any).data.leaveRequests
            : [];
      const filtered = Array.isArray(data)
        ? data.filter((r: any) => {
            let match = false;
            const empBranch = r.employee?.branch;
            if (r.employeeId === user?.employeeId) return false;
            if (userBranchId && (empBranch?.id === userBranchId || (r.branch && typeof r.branch === 'object' && r.branch.id === userBranchId))) {
              match = true;
            }
            const branchNameToUse = userBranchName || empBranch?.name;
            if (!match && branchNameToUse) {
              if (empBranch?.name && empBranch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) match = true;
              if (!match && r.branch) {
                if (typeof r.branch === 'object' && r.branch.name && r.branch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) match = true;
                if (!match && typeof r.branch === 'string' && r.branch.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) match = true;
              }
            }
            return match;
          })
        : [];
      const mapped = filtered
        .map((r: any) => {
          return {
            ...r,
            employeeName: r.employeeName || (r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : ''),
            branch: r.employee?.branch?.name || r.branch || '',
            leaveType: r.leaveTypeName || r.leaveType?.name || r.leaveType || '',
            startDate: r.startDate,
            endDate: r.endDate,
            days: r.days || r.totalDays,
            reason: r.reason,
            status: r.status,
            submissionDate: r.appliedAt || r.submissionDate,
            id: r.id,
            employeeId: r.employeeId,
            opsManagerId: r.opsManagerId,
            opsManagerName: r.opsManagerName,
            opsInitialDate: r.opsInitialDate,
            opsInitialComments: r.opsInitialComments,
            hrReviewerId: r.hrReviewerId,
            hrReviewerName: r.hrReviewerName,
            hrReviewDate: r.hrReviewDate,
            hrDecision: r.hrDecision,
            hrComments: r.hrComments,
            opsFinalDate: r.opsFinalDate,
            opsFinalDecision: r.opsFinalDecision,
            opsFinalComments: r.opsFinalComments,
            currentStep: r.currentStep ?? '',
            workflowHistory: r.workflowHistory ?? [],
          };
        })
        .filter((r: any) => r.status !== 'deleted' && r.status !== 'cancelled');
      setLeaveRequests(mapped);
      setIsViewDialogOpen(false);
      setApprovalComments("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to process leave request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, request?: any) => {
    if (status === 'PENDING') {
      // Determine if the current user is the branch manager for this request's branch
      let userBranch = user?.branch as unknown as import('@/types/branch').Branch | undefined;
      let userBranchId = userBranch?.id;
      let userBranchName = userBranch?.name;
      if (!userBranchId && user?.branchId) userBranchId = user.branchId;
      if (!userBranchName && user?.branchName) userBranchName = user.branchName;
      const empBranch = request?.employee?.branch;
      const branchIdMatch = userBranchId && (empBranch?.id === userBranchId || (request?.branch && typeof request.branch === 'object' && request.branch.id === userBranchId));
      const branchNameToUse = userBranchName || empBranch?.name;
      let branchNameMatch = false;
      if (branchNameToUse) {
        if (empBranch?.name && empBranch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) branchNameMatch = true;
        if (!branchNameMatch && request?.branch) {
          if (typeof request.branch === 'object' && request.branch.name && request.branch.name.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) branchNameMatch = true;
          if (!branchNameMatch && typeof request.branch === 'string' && request.branch.trim().toLowerCase() === branchNameToUse.trim().toLowerCase()) branchNameMatch = true;
        }
      }
      if (branchIdMatch || branchNameMatch) {
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Operations Review</Badge>;
      } else {
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending HR Review</Badge>;
      }
    } else if (status === 'APPROVED') {
      return <Badge variant="default" className="bg-green-500">Approved</Badge>;
    } else if (status === 'REJECTED') {
      return <Badge variant="destructive">Rejected</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string | undefined, name?: string) => {
    const colors: Record<string, string> = {
      annual: 'bg-blue-500',
      sick: 'bg-red-500',
      personal: 'bg-purple-500',
      maternity: 'bg-pink-500',
      emergency: 'bg-orange-500'
    };
    return <Badge className={colors[type || ''] || 'bg-gray-500'}>{name || type}</Badge>;
  };

  const opsPendingRequests = leaveRequests.filter(r => r.status === 'PENDING');
  const opsApprovedRequests = leaveRequests.filter(r => r.status === 'APPROVED');
  const opsRejectedRequests = leaveRequests.filter(r => r.status === 'REJECTED');

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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Operations Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{opsPendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operations Approved</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{opsApprovedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Eligible</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operations Rejected</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{opsRejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Not eligible</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Employee leave requests requiring Operations review</CardDescription>
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
                      <div className="font-medium">{request.employeeName}</div>
                    </TableCell>
                    <TableCell>{request.branch}</TableCell>
                    <TableCell>
                      {request.leaveType === null || request.leaveType === undefined
                        ? <Badge className="bg-gray-300 text-gray-700">Unknown</Badge>
                        : (isLeaveTypeObject(request.leaveType)
                            ? getLeaveTypeBadge(request.leaveType.code, request.leaveType.name)
                            : getLeaveTypeBadge(request.leaveType))}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.startDate).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">to {new Date(request.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{
                      !request.reason ||
                      request.reason.trim() === '' ||
                      (request.employeeName && request.reason.trim().toLowerCase() === request.employeeName.trim().toLowerCase())
                        ? 'Not defined'
                        : request.reason
                    }</TableCell>
                    <TableCell>{getStatusBadge(request.status, request)}</TableCell>
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
                        {request.status === 'PENDING' && (
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
                {/* Main details section (no duplicate) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="text-sm">{selectedRequest.employeeName}</p>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <p className="text-sm">{selectedRequest.branch}</p>
                  </div>
                  <div>
                    <Label>Leave Type</Label>
                    <div className="mt-1">
                      {selectedRequest.leaveType === null || selectedRequest.leaveType === undefined
                        ? <Badge className="bg-gray-300 text-gray-700">Unknown</Badge>
                        : (isLeaveTypeObject(selectedRequest.leaveType)
                            ? getLeaveTypeBadge(selectedRequest.leaveType.code, selectedRequest.leaveType.name)
                            : getLeaveTypeBadge(selectedRequest.leaveType))}
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status, selectedRequest)}</div>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Total Days</Label>
                    <p className="text-sm">{selectedRequest.days} days</p>
                  </div>
                  <div>
                    <Label>Submitted Date</Label>
                    <p className="text-sm">{new Date(selectedRequest.submissionDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Reason</Label>
                    <p className="text-sm mt-1">{selectedRequest.reason}</p>
                  </div>
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
            </div>
          )}
          <div className="flex justify-end space-x-2">
            {selectedRequest?.status === 'PENDING' ? (
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
  </DashboardLayout>);
};

export default OperationsLeaveApprovals;