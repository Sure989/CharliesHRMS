import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import PayrollDataService from '@/services/payrollDataService';
import { salaryAdvanceService } from '@/services/api/salaryAdvance.service';



// --- PayrollEngine helper (add this if not already imported from a shared utils file) ---
const PayrollEngine = {
  calculateMaxAdvanceLimit: (monthlySalary: number) => Math.round(monthlySalary * 0.25),
  calculateAvailableCredit: (monthlySalary: number, totalActiveAdvances: number) =>
    Math.max(Math.round(monthlySalary * 0.25) - totalActiveAdvances, 0),
};

// --- Status color and icon helpers (from OpsManagerSalaryAdvancePage) ---
// --- Status color and icon helpers (matching OpsManagerSalaryAdvancePage) ---

// Friendly status label for UI
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending_ops_initial':
      return 'Pending Operations Review';
    case 'forwarded_to_hr':
      return 'Pending HR Review';
    case 'hr_approved':
      return 'Pending Final Approval';
    case 'hr_rejected':
      return 'Rejected by HR';
    case 'ops_final_approved':
      return 'Approved (Ready for Disbursement)';
    case 'ops_final_rejected':
      return 'Rejected by Operations';
    case 'disbursed':
      return 'Disbursed';
    case 'repaying':
      return 'Repaying';
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status.replace(/_/g, ' ');
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_ops_initial':
      return 'bg-orange-100 text-orange-800';
    case 'forwarded_to_hr':
      return 'bg-blue-100 text-blue-800';
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
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

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
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

// ----------------------

// Helper to format currency in compact form (e.g., KSH 12K)
function formatCurrencyCompact(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
  return 'KSH ' + amount.toLocaleString('en-KE', { notation: 'compact', maximumFractionDigits: 1 });
}
// Place all hooks and logic here, before the return statement
// ----------------------



  const SalaryAdvanceRequestPage = () => {
    // Get current user
    const { user } = useAuth();
  
    // Get toast function
    const { toast } = useToast();
  

    // Get employee payroll information
    const [employeeInfo, setEmployeeInfo] = useState<any>(null);
    const [monthlySalary, setMonthlySalary] = useState<number|null>(null);

    // Requests state and loading state
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Dialog state for new request
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form setup
    const form = useForm({
      defaultValues: {
        amount: '',
        disbursementMethod: 'bank_transfer',
        reason: '',
      },
    });

    // Load salary advance requests from API (robust parsing, like OpsManagerSalaryAdvancePage)
    const loadRequests = useCallback(async () => {
      if (!user?.employeeId) return;
      try {
        setLoading(true);
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({ employeeId: user.employeeId });
        // Debug: log the raw response
        console.log('SalaryAdvanceRequestPage: API response', response);
        let responseData: any[] = [];
        if (Array.isArray(response)) {
          responseData = response;
        } else if (Array.isArray((response as any)?.requests)) {
          responseData = (response as any).requests;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          typeof response.data === 'object' &&
          Array.isArray((response.data as any).requests)
        ) {
          responseData = (response.data as any).requests;
        } else if (Array.isArray((response as any)?.data)) {
          responseData = (response as any).data;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          Array.isArray(response.data)
        ) {
          responseData = response.data;
        } else {
          console.error('Unexpected response shape:', response);
        }
        // Debug: log the parsed responseData
        console.log('SalaryAdvanceRequestPage: parsed responseData', responseData);

        const advances = Array.isArray(responseData) ? responseData.map((apiReq: any) => ({
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
            monthlyDeduction: apiReq.monthlyDeduction ?? (apiReq.payrollIntegration && apiReq.payrollIntegration.monthlyDeduction) ?? 0,
            repaymentMonths: apiReq.repaymentMonths ?? (apiReq.payrollIntegration && apiReq.payrollIntegration.repaymentMonths) ?? 1,
          },
          repaymentDetails: {
            remainingBalance: apiReq.outstandingBalance ?? (apiReq.repaymentDetails && apiReq.repaymentDetails.remainingBalance) ?? 0,
            originalAmount: apiReq.requestedAmount ?? (apiReq.repaymentDetails && apiReq.repaymentDetails.originalAmount) ?? 0,
            totalDeducted: apiReq.totalRepaid ?? (apiReq.repaymentDetails && apiReq.repaymentDetails.totalDeducted) ?? 0,
            repaymentMethod: apiReq.disbursementMethod || '',
          },
          hrEligibilityDetails: apiReq.hrEligibilityDetails || apiReq.eligibility || {},
          workflowHistory: apiReq.workflowHistory || apiReq.history || [],
          disbursedDate: apiReq.disbursedDate || apiReq.dateDisbursed || null,
        })) : [];
        setRequests(advances);
      } catch (error) {
        console.error('Failed to load salary advance requests:', error);
        setRequests([]);
        toast({
          title: 'Error',
          description: 'Failed to load salary advance requests from the server.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, [user, toast]);

    useEffect(() => {
      loadRequests();
    }, [loadRequests]);

    // Get employee payroll information (from DB)
    const loadEmployeeInfo = useCallback(async () => {
      if (!user?.employeeId) {
        setMonthlySalary(null);
        setEmployeeInfo(null);
        return;
      }
      try {
        // Pass the full user object, not just employeeId
        const info = await PayrollDataService.getEmployeeInfo(user);
        setEmployeeInfo(info);
        setMonthlySalary(typeof info?.monthlySalary === 'number' ? info.monthlySalary : null);
      } catch (error) {
        console.error('Failed to load employee info:', error);
        setMonthlySalary(null);
        setEmployeeInfo(null);
        toast({
          title: 'Employee Not Found',
          description: 'Your employee profile could not be found. Please contact HR to ensure your profile is set up correctly.',
          variant: 'destructive',
        });
      }
    }, [user, toast]);

    useEffect(() => {
      loadEmployeeInfo();
    }, [loadEmployeeInfo]);

    // Handle form submission (add this if missing)
    const onSubmit = async (data: any) => {
      try {
        const amount = parseFloat(data.amount);
        if (amount > (monthlySalary ? PayrollEngine.calculateMaxAdvanceLimit(monthlySalary) : 0)) {
          toast({
            title: 'Amount Exceeds Limit',
            description: `Maximum advance allowed is ${monthlySalary ? formatCurrencyCompact(PayrollEngine.calculateMaxAdvanceLimit(monthlySalary)) : 'N/A'} (25% of your salary).`,
            variant: 'destructive',
          });
          return;
        }
        // TODO: Add availableCredit check if needed
        const newRequest = {
          requestedAmount: amount,
          reason: data.reason,
          disbursementMethod: data.disbursementMethod,
        };
        // Remove fallback for PayrollDataService.createSalaryAdvanceRequest
        // Only use salaryAdvanceService
        await salaryAdvanceService.createSalaryAdvanceRequest(newRequest);
        // After successful POST, fetch the latest list
        const response = await salaryAdvanceService.getSalaryAdvanceRequests({ employeeId: user.employeeId });
        let responseData: any[] = [];
        if (Array.isArray(response)) {
          responseData = response;
        } else if (Array.isArray((response as any)?.requests)) {
          responseData = (response as any).requests;
        } else if (Array.isArray((response as any)?.data)) {
          responseData = (response as any).data;
        } else if (Array.isArray((response as any)?.data?.requests)) {
          responseData = (response as any).data.requests;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          Array.isArray(response.data)
        ) {
          responseData = response.data;
        } else {
          console.error('Unexpected response shape:', response);
        }
        const advances = Array.isArray(responseData) ? responseData.map((apiReq: any) => ({
          id: apiReq.id ?? '',
          employeeId: apiReq.employeeId ?? '',
          employeeName: apiReq.employee && typeof apiReq.employee === 'object' && apiReq.employee.firstName && apiReq.employee.lastName ? `${apiReq.employee.firstName} ${apiReq.employee.lastName}` : '',
          branch: apiReq.employee && typeof apiReq.employee === 'object' ? apiReq.employee.department || '' : '',
          amount: apiReq.requestedAmount ?? 0,
          disbursementMethod: apiReq.disbursementMethod || '',
          reason: apiReq.reason || '',
          status: apiReq.status || '',
          requestDate: apiReq.requestDate || apiReq.createdAt || '',
          opsManagerName: apiReq.approver && typeof apiReq.approver === 'object' && apiReq.approver.firstName && apiReq.approver.lastName ? `${apiReq.approver.firstName} ${apiReq.approver.lastName}` : '',
          opsInitialDate: apiReq.createdAt || '',
          opsInitialComments: apiReq.opsInitialComments || '',
          hrReviewerName: apiReq.hrReviewerName || (apiReq.hrReviewer && typeof apiReq.hrReviewer === 'object' && apiReq.hrReviewer.firstName && apiReq.hrReviewer.lastName ? `${apiReq.hrReviewer.firstName} ${apiReq.hrReviewer.lastName}` : ''),
          hrReviewDate: apiReq.hrReviewDate || '',
          hrDecision: apiReq.hrDecision || '',
          hrComments: apiReq.hrComments || '',
          opsFinalDate: apiReq.opsFinalDate || apiReq.updatedAt || '',
          opsFinalDecision: apiReq.opsFinalDecision || '',
          opsFinalComments: apiReq.opsFinalComments || '',
          currentStep: apiReq.status || '',
          payrollIntegration: apiReq.payrollIntegration || {},
          repaymentDetails: apiReq.repaymentDetails || {},
          hrEligibilityDetails: apiReq.hrEligibilityDetails || {},
          workflowHistory: apiReq.workflowHistory || [],
          disbursedDate: apiReq.disbursedDate || null,
        })) : [];
        setRequests(advances);
        setIsDialogOpen(false);
        form.reset();
        toast({
          title: 'Request Submitted',
          description: 'Your salary advance request has been submitted for approval. The full amount will be deducted from your next salary payment.',
        });
      } catch (error) {
        console.error('Failed to submit salary advance request:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit request. Please try again.',
          variant: 'destructive',
        });
      }
    };
  
    // Calculate statistics

    // Treat all 'in review' statuses as pending
    const pendingStatuses = [
      'pending_ops_initial',
      'forwarded_to_hr',
      'hr_approved',
      'pending',
    ];
    const activeStatuses = [
      'ops_final_approved',
      'disbursed',
      'repaying',
      'approved',
    ];

    const pendingRequests = requests.filter(r => pendingStatuses.includes(r.status)).length;

    // All approved/disbursed/repaying requests are active advances
    const totalActiveAdvances = requests
      .filter(req => activeStatuses.includes(req.status))
      .reduce((sum, req) => sum + (req.repaymentDetails?.remainingBalance || 0), 0);

    // Any repayment status (disbursed, repaying) should be included in monthly deduction
    const monthlyDeductionStatuses = ['disbursed', 'repaying'];
    const totalMonthlyDeductions = requests
      .filter(req => monthlyDeductionStatuses.includes(req.status))
      .reduce((sum, req) => sum + (req.payrollIntegration?.monthlyDeduction || 0), 0);
  
    // Calculate max advance limit and available credit using the payroll engine
    const maxAdvanceLimit = monthlySalary ? PayrollEngine.calculateMaxAdvanceLimit(monthlySalary) : null;
    const availableCredit = (monthlySalary && maxAdvanceLimit !== null)
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
        value: totalActiveAdvances != null ? formatCurrencyCompact(totalActiveAdvances) : 'N/A',
        description: 'Outstanding balance',
        icon: DollarSign,
      },
      {
        title: 'Monthly Deduction',
        value: totalMonthlyDeductions != null ? formatCurrencyCompact(totalMonthlyDeductions) : 'N/A',
        description: 'From your salary',
        icon: Calendar,
      },
      {
        title: 'Available Credit',
        value: availableCredit != null ? formatCurrencyCompact(availableCredit) : 'N/A',
        description: 'Based on your salary',
        icon: CheckCircle,
      },
    ];
  
    if (loading) {
      return (
        <DashboardLayout title="Salary Advance Requests">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading salary advance requests...</p>
            </div>
          </div>
        </DashboardLayout>
      );
    }
  
    if (monthlySalary === null) {
      return (
        <DashboardLayout title="Salary Advance Requests">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Unable to fetch your salary information from the server.<br/>Please contact HR or try again later.</p>
            </div>
          </div>
        </DashboardLayout>
      );
    }
  
    return (
      <DashboardLayout title="Salary Advance Requests">
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Welcome, {user?.firstName || ''}!</h2>
            <p className="text-muted-foreground">Manage your salary advance requests</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (KSH)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount in Kenyan Shillings" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Repayment Information</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Maximum advance: <strong>{maxAdvanceLimit != null ? formatCurrencyCompact(maxAdvanceLimit) : 'N/A'}</strong> (25% of your monthly salary)
                    </p>
                    <p className="text-sm text-blue-700">
                      Repayment: The full amount will be deducted from your next salary payment
                    </p>
                    <p className="text-sm text-blue-700">
                      Available credit: <strong>{availableCredit != null ? formatCurrencyCompact(availableCredit) : 'N/A'}</strong>
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="disbursementMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disbursement Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select disbursement method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money (M-Pesa)</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Advance</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Please explain why you need this advance" {...field} />
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
            <CardTitle>Your Advance Requests</CardTitle>
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
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.amount != null ? formatCurrencyCompact(request.amount) : 'N/A'}</TableCell>
                    <TableCell>
                      {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {getStatusLabel(request.status)}
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
                            {request.payrollIntegration?.monthlyDeduction != null ? formatCurrencyCompact(request.payrollIntegration.monthlyDeduction) : 'N/A'} deduction
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pending approval</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.repaymentDetails?.remainingBalance 
                        ? formatCurrencyCompact(request.repaymentDetails.remainingBalance)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Salary Advance Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <p>{request.amount != null ? formatCurrencyCompact(request.amount) : 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusLabel(request.status)}
                                </Badge>
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
                                <p>{request.payrollIntegration?.monthlyDeduction != null ? formatCurrencyCompact(request.payrollIntegration.monthlyDeduction) : 'N/A'}</p>
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

                            {/* Workflow History */}
                            {(request.opsManagerName || request.hrReviewerName) && (
                              <div className="space-y-3 border-t pt-4">
                                <h4 className="font-semibold">Approval History</h4>
                                
                                {request.opsManagerName && (
                                  <div className="border-l-4 border-blue-500 pl-4">
                                    <label className="text-sm font-medium">Operations Review</label>
                                    <p className="text-sm">{request.opsManagerName} on {request.opsInitialDate}</p>
                                    {request.opsInitialComments && (
                                      <p className="text-sm text-muted-foreground">{request.opsInitialComments}</p>
                                    )}
                                  </div>
                                )}
                                
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

                            {/* Repayment Details */}
                            {request.repaymentDetails && (
                              <div className="space-y-3 border-t pt-4">
                                <h4 className="font-semibold">Repayment Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Original Amount</label>
                                    <p>{request.repaymentDetails?.originalAmount != null ? formatCurrencyCompact(request.repaymentDetails.originalAmount) : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Total Deducted</label>
                                    <p>{request.repaymentDetails?.totalDeducted != null ? formatCurrencyCompact(request.repaymentDetails.totalDeducted) : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Remaining Balance</label>
                                    <p className="font-bold">{request.repaymentDetails?.remainingBalance != null ? formatCurrencyCompact(request.repaymentDetails.remainingBalance) : 'N/A'}</p>
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

export default SalaryAdvanceRequestPage;
