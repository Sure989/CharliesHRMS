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
import { api } from '@/services/unifiedApi';
import { formatCurrencyCompact } from '@/utils/currency';
import type { SalaryAdvanceRequest } from '@/types/types';
import { PayrollEngine } from '@/services/payrollEngine';
import { PayrollDataService } from '@/services/payrollDataService';

const SalaryAdvanceRequestPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
      if (!user?.employeeId) return;
      
      try {
        setLoading(true);
        const employeeRequests = await api.data.getSalaryAdvanceRequests('employee', { employeeId: user.employeeId });
        setRequests(employeeRequests);
      } catch (error) {
        console.error('Failed to load salary advance requests:', error);
        toast({
          title: "Error",
          description: "Failed to load salary advance requests from the server.",
          variant: "destructive"
        });
        setRequests([]); // No mock data fallback
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user, toast]);

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ops_initial':
        return <Clock className="h-4 w-4" />;
      case 'forwarded_to_hr':
        return <Clock className="h-4 w-4" />;
      case 'hr_approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'hr_rejected':
        return <XCircle className="h-4 w-4" />;
      case 'ops_final_approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'ops_final_rejected':
        return <XCircle className="h-4 w-4" />;
      case 'disbursed':
        return <DollarSign className="h-4 w-4" />;
      case 'repaying':
        return <Calendar className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const amount = parseFloat(data.amount);

      // Validate amount against maximum limit
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
        employeeId: Number(user?.employeeId) || 0,
        employeeName: `${user?.firstName} ${user?.lastName}` || 'Employee',
        branch: user?.branch || 'Main Branch',
        amount,
        reason: data.reason,
        disbursementMethod: data.disbursementMethod
      };

      await api.data.submitSalaryAdvanceRequest(newRequest);
      
      // Reload requests
      const updatedRequests = await api.data.getSalaryAdvanceRequests('employee', { employeeId: user?.employeeId });
      setRequests(updatedRequests);
      
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

  // Get employee payroll information
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [monthlySalary, setMonthlySalary] = useState<number>(0);

  // Load employee info
  useEffect(() => {
    const loadEmployeeInfo = async () => {
      if (!user) return;
      
      try {
        const info = await PayrollDataService.getEmployeeInfo(user);
        setEmployeeInfo(info);
        setMonthlySalary(info?.monthlySalary || 0);
      } catch (error) {
        console.error('Failed to load employee info:', error);
        // Set default values if API call fails
        setMonthlySalary(65000);
      }
    };

    loadEmployeeInfo();
  }, [user]);

  // Calculate statistics
  const totalActiveAdvances = requests
    .filter(req => req.status === 'disbursed' || req.status === 'repaying')
    .reduce((sum, req) => sum + (req.repaymentDetails?.remainingBalance || 0), 0);

  const totalMonthlyDeductions = requests
    .filter(req => req.status === 'disbursed' || req.status === 'repaying')
    .reduce((sum, req) => sum + (req.payrollIntegration?.monthlyDeduction || 0), 0);

  const pendingRequests = requests.filter(r => 
    r.status === 'pending_ops_initial' || 
    r.status === 'forwarded_to_hr' || 
    r.status === 'hr_approved'
  ).length;

  // Calculate max advance limit and available credit using the payroll engine
  const maxAdvanceLimit = PayrollEngine.calculateMaxAdvanceLimit(monthlySalary);
  const availableCredit = PayrollEngine.calculateAvailableCredit(monthlySalary, totalActiveAdvances);

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
      value: formatCurrencyCompact(availableCredit),
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

  return (
    <DashboardLayout title="Salary Advance Requests">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Welcome, {user?.firstName}!</h2>
            <p className="text-muted-foreground">Manage your salary advance requests</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                      Maximum advance: <strong>{formatCurrencyCompact(maxAdvanceLimit)}</strong> (25% of your monthly salary)
                    </p>
                    <p className="text-sm text-blue-700">
                      Repayment: The full amount will be deducted from your next salary payment
                    </p>
                    <p className="text-sm text-blue-700">
                      Available credit: <strong>{formatCurrencyCompact(availableCredit)}</strong>
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
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
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
                    <TableCell className="font-medium">{formatCurrencyCompact(request.amount)}</TableCell>
                    <TableCell>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
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
                                <p>{formatCurrencyCompact(request.amount)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status.replace(/_/g, ' ')}
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
                                <p>{formatCurrencyCompact(request.payrollIntegration?.monthlyDeduction || 0)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Disbursement Method</label>
                                <p>{request.disbursementMethod?.replace(/_/g, ' ')}</p>
                              </div>
                              {request.disbursedDate && (
                                <div>
                                  <label className="text-sm font-medium">Disbursed Date</label>
                                  <p>{new Date(request.disbursedDate).toLocaleDateString()}</p>
                                </div>
                              )}
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
                                    <p>{formatCurrencyCompact(request.repaymentDetails.originalAmount)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Total Deducted</label>
                                    <p>{formatCurrencyCompact(request.repaymentDetails.totalDeducted)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Remaining Balance</label>
                                    <p className="font-bold">{formatCurrencyCompact(request.repaymentDetails.remainingBalance)}</p>
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
