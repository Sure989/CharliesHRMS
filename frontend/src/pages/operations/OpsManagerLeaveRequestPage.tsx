import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Calendar, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/api/leave.service';
import type { LeaveRequest } from '@/types/types';


const OpsManagerLeaveRequestPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string }[]>([]);
  // Load leave types from API
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        // You may need to adjust the API endpoint/service
        const response = await leaveService.getLeaveTypes();
        // Defensive: handle array, { data: [] }, or { leaveTypes: [] }
        let typesArray: any[] = [];
        if (Array.isArray(response)) {
          typesArray = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray((response as any).data)) {
            typesArray = (response as any).data;
          } else if (Array.isArray((response as any).leaveTypes)) {
            typesArray = (response as any).leaveTypes;
          }
        }
        setLeaveTypes(typesArray.map((t: any) => ({ id: t.id, name: t.name })));
      } catch (error) {
        setLeaveTypes([]);
      }
    };
    fetchLeaveTypes();
  }, []);
  
  const form = useForm({
    defaultValues: {
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: ''
    }
  });

  // Load leave requests from API
  useEffect(() => {
    const loadRequests = async () => {
      if (!user?.employeeId) {
        console.warn('No employeeId found for user:', user);
        return;
      }
      try {
        setLoading(true);
        // Get branch info from user.branch, fallback to user.branchId/user.branchName if missing
        let userBranch = user?.branch as any;
        let userBranchId = userBranch?.id;
        let userBranchName = userBranch?.name;
        if (!userBranchId && user?.branchId) userBranchId = user.branchId;
        if (!userBranchName && user?.branchName) userBranchName = user.branchName;
        if (!userBranchId && !userBranchName) {
          console.log('User object missing branch info:', user);
        }
        // Fetch all leave requests (do not filter by branchName in API call)
        const response = await leaveService.getLeaveRequests();
        let data = Array.isArray(response)
          ? response
          : Array.isArray((response as any)?.leaveRequests)
            ? (response as any).leaveRequests
            : Array.isArray((response as any)?.data?.leaveRequests)
              ? (response as any).data.leaveRequests
              : [];
        // Only show leave requests submitted by the current branch manager (user)
        const filtered = Array.isArray(data)
          ? data.filter((r: any) => r.employeeId === user?.employeeId)
          : [];
        // Map backend fields to LeaveRequest type
        const mappedRequests = filtered.map((req: any) => ({
          ...req,
          employeeName: req.employeeName
            || (req.employee && req.employee.firstName && req.employee.lastName
                ? `${req.employee.firstName} ${req.employee.lastName}`
                : ''),
          branch: req.employee?.branch?.name || req.branch || '',
          days: req.days
            ?? req.totalDays
            ?? (req.startDate && req.endDate
                ? (Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 3600 * 24)) + 1)
                : 1),
          submissionDate: req.submissionDate
            ?? req.appliedAt
            ?? req.createdAt
            ?? new Date().toISOString(),
          leaveType: typeof req.leaveType === 'object' && req.leaveType && 'name' in req.leaveType
            ? req.leaveType.name
            : (typeof req.leaveType === 'string' ? req.leaveType : 'Unknown'),
        }));
        setRequests(mappedRequests);
      } catch (error) {
        console.error('Failed to load leave requests:', error);
        toast({
          title: "Info",
          description: "Failed to load leave requests from the server.",
          variant: "destructive"
        });
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [user, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-300 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const timeDifference = endDate.getTime() - startDate.getTime();
      const days = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;

      // Only send required fields for backend validation
      const apiRequest = {
        employeeId: user?.employeeId, // UUID for API
        leaveTypeId: data.leaveType, // ID
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      };
      // Defensive: check for missing fields
      if (!apiRequest.employeeId || !apiRequest.leaveTypeId || !apiRequest.startDate || !apiRequest.endDate || !apiRequest.reason) {
        toast({
          title: "Validation Error",
          description: "All fields are required. Please fill in all fields before submitting.",
          variant: "destructive"
        });
        return;
      }
      console.log('user:', user);
      console.log('apiRequest:', apiRequest);
      try {
        const response = await leaveService.createLeaveRequest(apiRequest);
        // Reload requests
        const getResponse = await leaveService.getLeaveRequests({ employeeId: user?.employeeId });
        // Defensive: handle { data: { leaveRequests: [] } }
        let requestsArray: any[] = [];
        if (Array.isArray(getResponse?.data)) {
          requestsArray = getResponse.data;
        } else if (
          getResponse?.data &&
          typeof getResponse.data === 'object' &&
          Array.isArray((getResponse.data as any).leaveRequests)
        ) {
          requestsArray = (getResponse.data as any).leaveRequests;
        } else if (Array.isArray((getResponse as any)?.requests)) {
          requestsArray = (getResponse as any).requests;
        }
        const mappedRequests = requestsArray.map((req: any) => ({
          ...req,
          employeeName: req.employeeName ?? '',
          branch: req.branch ?? '',
          days: req.days ?? (
            req.startDate && req.endDate
              ? (Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 3600 * 24)) + 1)
              : 1
          ),
          submissionDate: req.submissionDate ?? req.createdAt ?? new Date().toISOString(),
          // Add other missing fields with fallbacks if needed
        }));
        setRequests(mappedRequests);
        setIsDialogOpen(false);
        form.reset();
        toast({
          title: "Request Submitted",
          description: "Your leave request has been submitted for approval.",
        });
      } catch (error: any) {
        console.error('Failed to submit leave request:', error);
        // Try to extract backend errors if present
        let errorMsg = "Failed to submit request. Please try again.";
        if (error?.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
          errorMsg = error.response.data.errors.join(' ');
        } else if (error?.response?.errors && Array.isArray(error.response.errors) && error.response.errors.length > 0) {
          errorMsg = error.response.errors.join(' ');
        } else if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
          errorMsg = error.errors.join(' ');
        } else if (error?.message) {
          errorMsg = error.message;
        }
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Failed to submit leave request:', error);
      // Try to extract backend errors if present
      let errorMsg = "Failed to submit request. Please try again.";
      if (error?.response?.errors && Array.isArray(error.response.errors) && error.response.errors.length > 0) {
        errorMsg = error.response.errors.join(' ');
      } else if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMsg = error.errors.join(' ');
      } else if (error?.message) {
        errorMsg = error.message;
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  // Calculate statistics
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const approvedRequests = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;
  // Calculate total days taken this year
  const currentYear = new Date().getFullYear();
  const totalDaysTaken = requests
    .filter(r => r.status === 'APPROVED' && new Date(r.startDate).getFullYear() === currentYear)
    .reduce((sum, r) => sum + r.days, 0);

  const stats = [
    {
      title: 'Pending Requests',
      value: pendingRequests.toString(),
      description: 'Awaiting approval',
      icon: Clock,
    },
    {
      title: 'Approved This Year',
      value: approvedRequests.toString(),
      description: 'Successfully approved',
      icon: CheckCircle,
    },
    {
      title: 'Days Taken',
      value: totalDaysTaken.toString(),
      description: `In ${currentYear}`,
      icon: Calendar,
    },
    {
      title: 'Rejected',
      value: rejectedRequests.toString(),
      description: 'Not approved',
      icon: XCircle,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="My Leave Requests (Ops Manager)">
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
    <DashboardLayout title="My Leave Requests (Ops Manager)">
      <div className="scrollable-content space-y-6">
        <div className="flex justify-between items-center">
          <div>
            {/* Removed welcome title */}
            <p className="text-muted-foreground">Manage your leave requests and view history</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2 text-white" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leaveType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                        <SelectContent>
                          {leaveTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Leave</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Please explain the reason for your leave request" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            let iconColor = "text-muted-foreground";
            if (stat.title === 'Pending Requests') iconColor = "text-orange-500";
            if (stat.title === 'Approved This Year') iconColor = "text-emerald-600";
            if (stat.title === 'Days Taken') iconColor = "text-blue-600";
            if (stat.title === 'Rejected') iconColor = "text-red-500";
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Card>
          <CardHeader>
            <CardDescription>Track the status of your leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.leaveType ? request.leaveType.replace('_', ' ').toUpperCase() : 'Unknown'}</TableCell>
                    <TableCell>
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{request.days} {request.days === 1 ? 'day' : 'days'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.replace(/_/g, ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(request.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Leave Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Leave Type</label>
                                <p>{request.leaveType ? request.leaveType.replace('_', ' ').toUpperCase() : 'Unknown'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <p>{new Date(request.startDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">End Date</label>
                                <p>{new Date(request.endDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Duration</label>
                                <p>{request.days} {request.days === 1 ? 'day' : 'days'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Submitted</label>
                                <p>{new Date(request.submissionDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Reason</label>
                              <p className="mt-1">{request.reason}</p>
                            </div>
                            {/* Only show HR and Final Approval history, not ops manager initial approval */}
                            {(request.hrReviewerName || request.opsFinalDate) && (
                              <div className="space-y-3 border-t pt-4">
                                <h4 className="font-semibold">Approval History</h4>
                                {request.hrReviewerName && (
                                  <div className="border-l-4 border-green-500 pl-4">
                                    <label className="text-sm font-medium">HR Review</label>
                                    <p className="text-sm">{request.hrReviewerName} on {request.hrReviewDate}</p>
                                    <p className="text-sm">Decision: {request.hrDecision}</p>
                                    {request.hrComments && (
                                      <p className="text-sm text-muted-foreground">{request.hrComments}</p>
                                    )}
                                  </div>
                                )}
                                {request.opsFinalDate && (
                                  <div className="border-l-4 border-purple-500 pl-4">
                                    <label className="text-sm font-medium">Final Approval</label>
                                    <p className="text-sm">Operations Manager on {request.opsFinalDate}</p>
                                    <p className="text-sm">Decision: {request.opsFinalDecision}</p>
                                    {request.opsFinalComments && (
                                      <p className="text-sm text-muted-foreground">{request.opsFinalComments}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OpsManagerLeaveRequestPage;

// --- Updated below to match employee LeaveRequests formatting ---

// ...imports remain unchanged...

// Add getStatusColor, getStatusIcon, onSubmit, stats, and detailed view dialog as in employee LeaveRequests

