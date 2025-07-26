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
import { DollarSign, Calendar, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service';
import { employeeService } from '@/services/api/employee.service';
import { formatCurrencyCompact } from '@/utils/currency';
import type { SalaryAdvanceRequest } from '@/types/types';
import { PayrollEngine } from '@/services/payrollEngine';
import { PayrollDataService } from '@/services/payrollDataService';


const OpsManagerSalaryAdvancePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [monthlySalary, setMonthlySalary] = useState<number|null>(null);

  const form = useForm({
    defaultValues: {
      amount: '',
      reason: '',
      disbursementMethod: 'bank_transfer'
    }
  });

  // Load salary advance requests from API
  useEffect(() => {
    const loadRequests = async () => {
      // Use UUID for API requests
      if (!user?.employeeId) return;
      try {
        setLoading(true);
        console.log('Loading salary advance requests for employeeId:', user.employeeId); // UUID
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({ employeeId: user.employeeId });
        console.log('Salary advance response:', response);
        if (response && typeof response === 'object' && response.data) {
          console.log('response.data:', response.data);
        }

        // Accept multiple possible response shapes robustly
        let responseData: any[] = [];
        if (Array.isArray(response)) {
          responseData = response;
        } else if (Array.isArray((response as any)?.requests)) {
          responseData = (response as any).requests;
        } else if (Array.isArray((response as any)?.data)) {
          responseData = (response as any).data;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          typeof response.data === 'object' &&
          Array.isArray((response.data as any).requests)
        ) {
          responseData = (response.data as any).requests;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          Array.isArray(response.data)
        ) {
          responseData = response.data;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          Array.isArray(Object.values(response.data)) &&
          Object.values(response.data).every(item => typeof item === 'object' && item.id)
        ) {
          // If data is an object whose values are the requests
          responseData = Object.values(response.data);
        } else {
          console.error('Unexpected response shape:', response);

        }

        // Map API response to local type, including HR and final approval fields if present
        const requestsMapped = Array.isArray(responseData) ? responseData.map((apiReq: any) => ({
          id: apiReq.id ?? apiReq._id ?? '',
          employeeId: apiReq.employeeId ?? apiReq.empId ?? '',
          employeeName:
            (apiReq.employee && typeof apiReq.employee === 'object' && (apiReq.employee.firstName || apiReq.employee.firstname) && (apiReq.employee.lastName || apiReq.employee.lastname))
              ? `${apiReq.employee.firstName ?? apiReq.employee.firstname} ${apiReq.employee.lastName ?? apiReq.employee.lastname}`
              : (apiReq.employeeName || ''),
          branch:
            (apiReq.employee && typeof apiReq.employee === 'object' && (apiReq.employee.department || apiReq.employee.branch))
              ? apiReq.employee.department ?? apiReq.employee.branch
              : (apiReq.branch || ''),
          amount: apiReq.requestedAmount ?? apiReq.amount ?? 0,
          disbursementMethod: apiReq.disbursementMethod || apiReq.method || '',
          reason: apiReq.reason || apiReq.purpose || '',
          status: (apiReq.status || apiReq.currentStatus || '').toLowerCase(),
          requestDate: apiReq.requestDate || apiReq.createdAt || apiReq.dateRequested || '',
          opsManagerName:
            (apiReq.approver && typeof apiReq.approver === 'object' && (apiReq.approver.firstName || apiReq.approver.firstname) && (apiReq.approver.lastName || apiReq.approver.lastname))
              ? `${apiReq.approver.firstName ?? apiReq.approver.firstname} ${apiReq.approver.lastName ?? apiReq.approver.lastname}`
              : (apiReq.opsManagerName || ''),
          opsInitialDate: apiReq.createdAt || apiReq.opsInitialDate || '',
          opsInitialComments: apiReq.opsInitialComments || apiReq.opsComments || '',
          hrReviewerName:
            apiReq.hrReviewerName
              || (apiReq.hrReviewer && typeof apiReq.hrReviewer === 'object' && (apiReq.hrReviewer.firstName || apiReq.hrReviewer.firstname) && (apiReq.hrReviewer.lastName || apiReq.hrReviewer.lastname)
                ? `${apiReq.hrReviewer.firstName ?? apiReq.hrReviewer.firstname} ${apiReq.hrReviewer.lastName ?? apiReq.hrReviewer.lastname}`
                : ''),
          hrReviewDate: apiReq.hrReviewDate || apiReq.hrReviewedAt || '',
          hrDecision: apiReq.hrDecision || apiReq.hrStatus || '',
          hrComments: apiReq.hrComments || apiReq.hrRemarks || '',
          opsFinalDate: apiReq.opsFinalDate || apiReq.updatedAt || '',
          opsFinalDecision: apiReq.opsFinalDecision || apiReq.finalDecision || '',
          opsFinalComments: apiReq.opsFinalComments || apiReq.finalComments || '',
          currentStep: (apiReq.status || apiReq.currentStep || '').toLowerCase(),
          payrollIntegration: {
            payrollDeductionId: (apiReq.payrollIntegration && apiReq.payrollIntegration.payrollDeductionId) ?? '',
            monthlyDeduction: apiReq.monthlyDeduction ?? (apiReq.payrollIntegration && apiReq.payrollIntegration.monthlyDeduction) ?? 0,
            repaymentMonths: apiReq.repaymentMonths ?? (apiReq.payrollIntegration && apiReq.payrollIntegration.repaymentMonths) ?? 1,
            startDeductionDate: (apiReq.payrollIntegration && apiReq.payrollIntegration.startDeductionDate) ?? '',
            estimatedCompletionDate: (apiReq.payrollIntegration && apiReq.payrollIntegration.estimatedCompletionDate) ?? '',
            deductionPriority: (apiReq.payrollIntegration && typeof apiReq.payrollIntegration.deductionPriority === 'number')
              ? apiReq.payrollIntegration.deductionPriority
              : 0,
          },
          repaymentDetails: {
            remainingBalance: apiReq.outstandingBalance ?? (apiReq.repaymentDetails && apiReq.repaymentDetails.remainingBalance) ?? 0,
            originalAmount: apiReq.requestedAmount ?? (apiReq.repaymentDetails && apiReq.repaymentDetails.originalAmount) ?? 0,
            totalDeducted: apiReq.totalRepaid ?? (apiReq.repaymentDetails && apiReq.repaymentDetails.totalDeducted) ?? 0,
            repaymentMethod: apiReq.disbursementMethod || '',
            deductionHistory: (apiReq.repaymentDetails && Array.isArray(apiReq.repaymentDetails.deductionHistory))
              ? apiReq.repaymentDetails.deductionHistory
              : [],
            lastDeductionDate: apiReq.repaymentDetails?.lastDeductionDate ?? undefined,
          },
          hrEligibilityDetails: apiReq.hrEligibilityDetails || apiReq.eligibility || {},
          workflowHistory: apiReq.workflowHistory || apiReq.history || [],
          disbursedDate: apiReq.disbursedDate || apiReq.dateDisbursed || null,
        })) : [];
        setRequests(requestsMapped);
      } catch (error) {
        console.error('Failed to load salary advance requests:', error);
        toast({
          title: "Error",
          description: "Failed to load salary advance requests from the server.",
          variant: "destructive"
        });
        setRequests([]); // Show empty if error, do not use mock data
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [user, toast]);

  // Get employee payroll information
  useEffect(() => {
    const loadEmployeeInfo = async () => {
      // Use UUID for API requests
      if (!user?.employeeId) {
        setMonthlySalary(null);
        setEmployeeInfo(null);
        return;
      }
      try {
        // Defensive: ensure employeeId is a string and not empty
        const employeeId = String(user.employeeId).trim();
        if (!employeeId) {
          setMonthlySalary(null);
          setEmployeeInfo(null);
          return;
        }
        console.log('Loading employee info for employeeId:', employeeId); // UUID
        const info = await employeeService.getEmployeeById(employeeId); // UUID
        if (!info || typeof info !== 'object') {
          setMonthlySalary(null);
          setEmployeeInfo(null);
          return;
        }
        console.log('Employee info loaded:', info);
        setEmployeeInfo(info);
        // Only set salary if it exists in DB, else null
        setMonthlySalary(typeof info?.salary === 'number' ? info.salary : null);
      } catch (error) {
        console.error('Failed to load employee info:', error);
        setMonthlySalary(null);
        setEmployeeInfo(null);
        // Optionally, show a toast for not found
        toast({
          title: "Employee Not Found",
          description: "Your employee profile could not be found. Please contact HR to ensure your profile is set up correctly.",
          variant: "destructive"
        });
      }
    };
    loadEmployeeInfo();
  }, [user, toast]);

  // Calculate statistics
  const totalActiveAdvances = requests
    .filter(req => req.status === 'disbursed' || req.status === 'repaying')
    .reduce((sum, req) => sum + (req.repaymentDetails?.remainingBalance || 0), 0);

  const totalMonthlyDeductions = requests
    .filter(req => req.status === 'disbursed' || req.status === 'repaying')
    .reduce((sum, req) => sum + (req.payrollIntegration?.monthlyDeduction || 0), 0);

  // Include 'pending' and all review statuses as pending
  const pendingStatuses = [
    'pending_ops_initial',
    'forwarded_to_hr',
    'hr_approved',
    'pending',
  ];
  const pendingRequests = requests.filter(r => pendingStatuses.includes(r.status)).length;

  // Calculate max advance limit and available credit using the payroll engine
  const maxAdvanceLimit = typeof monthlySalary === 'number' && monthlySalary > 0
    ? PayrollEngine.calculateMaxAdvanceLimit(monthlySalary)
    : null;
  const availableCredit = typeof monthlySalary === 'number' && maxAdvanceLimit !== null
    ? PayrollEngine.calculateAvailableCredit(monthlySalary, totalActiveAdvances)
    : null;

  const stats = [
    {
      title: 'Pending Requests',
      value: pendingRequests.toString(),
      description: 'Awaiting approval',
      icon: Clock,
    },
    {
      title: 'Active Advances',
      value: formatCurrencyCompact(totalActiveAdvances),
      description: 'Outstanding balance',
      icon: DollarSign,
    },
    {
      title: 'Monthly Deduction',
      value: formatCurrencyCompact(totalMonthlyDeductions),
      description: 'From your salary',
      icon: Calendar,
    },
    {
      title: 'Available Credit',
      value: availableCredit !== null ? formatCurrencyCompact(availableCredit) : 'N/A',
      description: 'Based on your salary',
      icon: CheckCircle,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return 'bg-orange-100 text-orange-800';
      case 'forwarded_to_hr':
        // Use a light blue badge similar to the attached image
        return 'bg-blue-100 text-blue-700';
      case 'hr_approved':
        return 'bg-green-100 text-green-800';
      case 'hr_rejected':
        return 'bg-red-100 text-red-800';
      case 'ops_final_approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'ops_final_rejected':
        return 'bg-red-100 text-red-800';
      case 'disbursed':
        return 'bg-green-100 text-green-800';
      case 'repaying':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Colored status icons
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'forwarded_to_hr':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'hr_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'hr_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ops_final_approved':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'ops_final_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disbursed':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'repaying':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const amount = parseFloat(data.amount);
      if (amount > maxAdvanceLimit) {
        toast({
          title: "Amount Exceeds Limit",
          description: `Maximum advance allowed is ${formatCurrencyCompact(maxAdvanceLimit)} (25% of your salary).`,
          variant: "destructive"
        });
        return;
      }
      if (amount > availableCredit) {
        toast({
          title: "Insufficient Credit",
          description: `Available credit is ${formatCurrencyCompact(availableCredit)}. Please repay existing advances first.`,
          variant: "destructive"
        });
        return;
      }
      const newRequest = {
        requestedAmount: amount,
        reason: data.reason,
      };
      await salaryAdvanceService.createSalaryAdvanceRequest(newRequest);
      // After successful POST, fetch the latest list
      const response = await salaryAdvanceService.getSalaryAdvanceRequests({ employeeId: user?.employeeId });
      const requestsMapped = Array.isArray(response?.data) ? response.data.map((apiReq: any) => ({
        id: apiReq.id,
        employeeId: apiReq.employeeId, // UUID for API
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
        // Removed duplicate opsFinalDecision property
        opsFinalComments: '',
        currentStep: apiReq.status,
        payrollIntegration: apiReq.payrollIntegration || {},
        repaymentDetails: apiReq.repaymentDetails || {},
        hrEligibilityDetails: apiReq.hrEligibilityDetails || {},
        workflowHistory: [],
      })) : [];
      setRequests(requestsMapped);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Request Submitted",
        description: "Your salary advance request has been submitted for approval. The full amount will be deducted from your next salary payment.",
      });
    } catch (error) {
      console.error('Failed to submit salary advance request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Salary Advance Requests (Ops Manager)">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p>Loading salary advance requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (monthlySalary === null || monthlySalary === 0) {
    return (
      <DashboardLayout title="My Salary Advance Requests (Ops Manager)">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">No salary has been set for your profile in the database.<br/>You cannot request a salary advance until HR sets your salary.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Only show requests submitted by the branch manager (the logged-in user)
  const myRequests = requests.filter(r => String(r.employeeId) === String(user?.employeeId));

  return (
    <DashboardLayout title="My Salary Advance Requests (Ops Manager)">
      <div className="scrollable-content space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Manage your salary advance requests</p>
          </div>
          {monthlySalary > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2 text-white" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Salary Advance</DialogTitle>
                  <DialogDescription>
                    Submit a new salary advance request for approval
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* ...existing code... */}
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            let iconColor = "text-muted-foreground";
            if (stat.title === 'Pending Requests') iconColor = "text-orange-500";
            if (stat.title === 'Active Advances') iconColor = "text-green-600";
            if (stat.title === 'Monthly Deduction') iconColor = "text-blue-600";
            if (stat.title === 'Available Credit') iconColor = "text-emerald-600";
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
            <CardDescription>Track the status of your salary advance applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Repayment</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((request) => (
                  <TableRow key={request.id}>
                    {/* ...existing code for rendering each row... */}
                    <TableCell className="font-medium">{typeof request.amount === 'number' ? formatCurrencyCompact(request.amount) : '-'}</TableCell>
                    <TableCell>
                      {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.replace(/_/g, ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'completed' ? (
                        <span className="text-sm text-green-600 font-medium">Fully Repaid</span>
                      ) : request.status === 'disbursed' ? (
                        <div>
                          <span className="text-sm font-medium">Next Payroll</span><br />
                          <span className="text-sm text-muted-foreground">
                            {formatCurrencyCompact(request.payrollIntegration?.monthlyDeduction || 0)} deduction
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pending approval</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.repaymentDetails?.remainingBalance != null && typeof request.repaymentDetails.remainingBalance === 'number'
                        ? formatCurrencyCompact(request.repaymentDetails.remainingBalance)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          {/* ...existing code for details dialog... */}
                          <DialogHeader>
                            <DialogTitle>Salary Advance Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* ...existing code for details... */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <p>{typeof request.amount === 'number' ? formatCurrencyCompact(request.amount) : '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                {request.status === 'forwarded_to_hr' ? (
                                  <Badge className="bg-blue-100 text-blue-700">
                                    {request.status.replace(/_/g, ' ')}
                                  </Badge>
                                ) : (
                                  <Badge className={getStatusColor(request.status)}>
                                    {request.status.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Reason</label>
                              <p className="mt-1">{request.reason}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Repayment Period</label>
                                <p>{request.payrollIntegration?.repaymentMonths} months</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Monthly Deduction</label>
                                <p>{formatCurrencyCompact(request.payrollIntegration?.monthlyDeduction || 0)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Disbursement Method</label>
                                <p>{request.disbursementMethod?.replace(/_/g, ' ')}</p>
                              </div>
                              {request.disbursedDate ? (
                                <div>
                                  <label className="text-sm font-medium">Disbursed Date</label>
                                  <p>{new Date(request.disbursedDate).toLocaleDateString()}</p>
                                </div>
                              ) : null}
                            </div>
                            {/* Approval History: Only show HR review if present, otherwise show nothing for forwarded_to_hr */}
                            {(request.hrReviewerName || (request.opsFinalDate && request.status !== 'forwarded_to_hr')) && (
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
                                {/* Only show Final Approval if not in forwarded_to_hr status */}
                                {request.opsFinalDate && request.status !== 'forwarded_to_hr' && (
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
                            {/* Repayment Details */}
                            {request.repaymentDetails && (
                              <div className="space-y-3 border-t pt-4">
                                <h4 className="font-semibold">Repayment Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Original Amount</label>
                                    <p>{typeof request.repaymentDetails.originalAmount === 'number' ? formatCurrencyCompact(request.repaymentDetails.originalAmount) : '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Total Deducted</label>
                                    <p>{typeof request.repaymentDetails.totalDeducted === 'number' ? formatCurrencyCompact(request.repaymentDetails.totalDeducted) : '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Remaining Balance</label>
                                    <p className="font-bold">{typeof request.repaymentDetails.remainingBalance === 'number' ? formatCurrencyCompact(request.repaymentDetails.remainingBalance) : '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Repayment Method</label>
                                    <p>{request.repaymentDetails.repaymentMethod?.replace(/_/g, ' ')}</p>
                                  </div>
                                </div>
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

export default OpsManagerSalaryAdvancePage;

// --- Updated below to match employee SalaryAdvanceRequest formatting ---

// ...imports remain unchanged...

// Add getStatusColor, getStatusIcon, onSubmit, stats, and detailed view dialog as in employee SalaryAdvanceRequest
