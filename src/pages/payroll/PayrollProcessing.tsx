import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Users, 
  DollarSign,
  Calculator,
  FileText,
  Download,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';
import { api } from '@/services/unifiedApi';
import { formatCurrencyCompact } from '@/utils/currency';
import type {
  PayrollPeriod,
  KenyanPayrollRecord as PayrollRecord,
  KenyanPayrollEmployee as PayrollEmployee
} from '@/types/payroll';

const PayrollProcessing = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const processingSteps = [
    { id: 1, name: 'Time Collection', description: 'Gathering employee time entries', completed: true },
    { id: 2, name: 'Payroll Calculation', description: 'Computing gross pay and hours', completed: true },
    { id: 3, name: 'Statutory Deductions', description: 'Calculating PAYE, NSSF, and NHIF', completed: false },
    { id: 4, name: 'Other Deductions', description: 'Processing loans, advances, and other deductions', completed: false },
    { id: 5, name: 'Approval Workflow', description: 'Routing for management approval', completed: false },
    { id: 6, name: 'Payment Generation', description: 'Creating bank transfer files and records', completed: false },
    { id: 7, name: 'Compliance Reporting', description: 'Generating P9 forms and statutory reports', completed: false }
  ];

  // Load payroll data from API
  useEffect(() => {
    const loadPayrollData = async () => {
      try {
        setLoading(true);
        
        // Get current payroll periods
        const periods = await api.payroll.getPayrollPeriods({ status: 'calculating' });
        if (periods.length > 0) {
          setCurrentPeriod(periods[0]);
          
          // Get payroll records for the current period
          const records = await api.payroll.calculatePayroll(periods[0].id);
          setPayrollRecords(records);
        } 
      } catch (error) {
        console.error('Failed to load payroll data:', error);
        toast({
          title: "Error",
          description: "Failed to load payroll data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPayrollData();
  }, [toast]);

  const handleStartProcessing = async () => {
    if (!currentPeriod) return;
    
    try {
      setIsProcessing(true);
      
      // Start payroll calculation
      const records = await api.payroll.calculatePayroll(currentPeriod.id);
      setPayrollRecords(records);
      
      // Simulate processing steps
      const interval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev >= processingSteps.length - 1) {
            clearInterval(interval);
            setIsProcessing(false);
            toast({
              title: "Processing Complete",
              description: "Payroll processing has been completed successfully."
            });
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to start payroll processing:', error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to start payroll processing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calculated': return 'bg-green-100 text-green-800';
      case 'exception': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'calculated': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exception': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate summary statistics
  const payrollSummary = {
    totalGrossPay: payrollRecords.reduce((sum, record) => sum + record.grossPay, 0),
    totalStatutoryDeductions: payrollRecords.reduce((sum, record) => sum + record.statutoryDeductions.total, 0),
    totalOtherDeductions: payrollRecords.reduce((sum, record) => sum + record.otherDeductions, 0),
    totalNetPay: payrollRecords.reduce((sum, record) => sum + record.netPay, 0),
    employeesProcessed: payrollRecords.filter(r => r.status === 'calculated').length,
    employeesWithExceptions: payrollRecords.filter(r => r.hasExceptions).length,
    averageGrossPay: payrollRecords.length > 0 ? payrollRecords.reduce((sum, record) => sum + record.grossPay, 0) / payrollRecords.length : 0,
    averageNetPay: payrollRecords.length > 0 ? payrollRecords.reduce((sum, record) => sum + record.netPay, 0) / payrollRecords.length : 0
  };

  if (loading) {
    return (
      <DashboardLayout title="Payroll Processing">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading payroll data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentPeriod) {
    return (
      <DashboardLayout title="Payroll Processing">
        <Card>
          <CardHeader>
            <CardTitle>No Active Payroll Period</CardTitle>
            <CardDescription>There are no payroll periods currently being processed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payroll Processing">
      <div className="space-y-6">
        {/* Current Period Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentPeriod.name}</CardTitle>
                <CardDescription>
                  {currentPeriod.startDate} to {currentPeriod.endDate} • Pay Date: {currentPeriod.payDate}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(currentPeriod.status)}>
                {currentPeriod.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentPeriod.totalEmployees}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{payrollSummary.employeesProcessed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrencyCompact(currentPeriod.totalGrossPay)}</div>
                <div className="text-sm text-muted-foreground">Gross Pay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrencyCompact(currentPeriod.totalNetPay)}</div>
                <div className="text-sm text-muted-foreground">Net Pay</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflow">Processing Workflow</TabsTrigger>
            <TabsTrigger value="employees">Employee Records</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="space-y-6">
            {/* Processing Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Payroll Processing Controls</CardTitle>
                <CardDescription>Manage the payroll processing workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={handleStartProcessing} 
                    disabled={isProcessing}
                    className="flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Start Processing</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" disabled={!isProcessing}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Workflow</CardTitle>
                <CardDescription>7-step Kenyan payroll processing workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-100 text-green-600' :
                        index === processingStep && isProcessing ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : index === processingStep && isProcessing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-medium">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                      <div className="text-sm">
                        {step.completed ? (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        ) : index === processingStep && isProcessing ? (
                          <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {isProcessing && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round(((processingStep + 1) / processingSteps.length) * 100)}%</span>
                    </div>
                    <Progress value={((processingStep + 1) / processingSteps.length) * 100} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Payroll Records</CardTitle>
                <CardDescription>Individual employee payroll calculations with Kenyan statutory deductions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>KRA PIN</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Statutory Deductions</TableHead>
                      <TableHead>Other Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.employeeName}</div>
                            <div className="text-sm text-muted-foreground">{record.employeeId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {record.payStub?.kraPin || 'Not Set'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Regular: {record.regularHours}h</div>
                            {record.overtimeHours > 0 && (
                              <div className="text-orange-600">OT: {record.overtimeHours}h</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrencyCompact(record.grossPay)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>PAYE: {formatCurrencyCompact(record.statutoryDeductions.paye)}</div>
                            <div>NSSF: {formatCurrencyCompact(record.statutoryDeductions.nssf)}</div>
                            <div>NHIF: {formatCurrencyCompact(record.statutoryDeductions.nhif)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrencyCompact(record.otherDeductions)}</TableCell>
                        <TableCell className="font-medium">{formatCurrencyCompact(record.netPay)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.status)}
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {payrollSummary.employeesWithExceptions} employees have exceptions that require attention before payroll can be completed.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Exception Report</CardTitle>
                <CardDescription>Employees with payroll exceptions requiring manual review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payrollRecords
                    .filter(record => record.hasExceptions)
                    .map((record) => (
                      <div key={record.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{record.employeeName}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.employeeId} • KRA PIN: {record.payStub?.kraPin || 'Not Set'}
                            </div>
                          </div>
                          <Badge className={getStatusColor(record.status)}>
                            {record.exceptions.length} Exception{record.exceptions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {record.exceptions.map((exception, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>{exception}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.totalGrossPay)}</div>
                  <p className="text-xs text-muted-foreground">Before taxes and deductions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Statutory Deductions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.totalStatutoryDeductions)}</div>
                  <p className="text-xs text-muted-foreground">PAYE, NSSF, and NHIF</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Other Deductions</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.totalOtherDeductions)}</div>
                  <p className="text-xs text-muted-foreground">Loans, advances, and benefits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.totalNetPay)}</div>
                  <p className="text-xs text-muted-foreground">Amount to be paid to employees</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Employees Processed:</span>
                      <span className="text-sm font-medium">{payrollSummary.employeesProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Employees with Exceptions:</span>
                      <span className="text-sm font-medium text-red-600">{payrollSummary.employeesWithExceptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Gross Pay:</span>
                      <span className="text-sm font-medium">{formatCurrencyCompact(payrollSummary.averageGrossPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Net Pay:</span>
                      <span className="text-sm font-medium">{formatCurrencyCompact(payrollSummary.averageNetPay)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Resolve all exceptions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Submit for approval</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Generate payment files</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Process payments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Approval Actions</CardTitle>
                <CardDescription>Submit payroll for approval once all exceptions are resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button 
                    disabled={payrollSummary.employeesWithExceptions > 0}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit for Approval</span>
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Summary
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                </div>
                {payrollSummary.employeesWithExceptions > 0 && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please resolve all exceptions before submitting for approval.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PayrollProcessing;
