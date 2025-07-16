import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  FileText, 
  TrendingUp,
  CreditCard,
  Settings,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '@/services/unifiedApi';
import { formatCurrencyCompact } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import PayrollDataService from '@/services/payrollDataService';
import type { 
  KenyanPayStub,
  KenyanPayrollRecord,
  PayrollPeriod 
} from '@/types/payroll';
import type { User } from '@/types/types';

interface EmployeeInfo {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  branch: string;
  hireDate: string;
  payFrequency: string;
  paymentMethod: string;
  bankAccount: string;
  kraPin: string;
  nssfNumber: string;
  nhifNumber: string;
  monthlySalary?: number;
  hourlyRate?: number;
  employeeType?: string;
}

const EmployeePayroll = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedPayStub, setSelectedPayStub] = useState<KenyanPayStub | null>(null);
  const [payStubs, setPayStubs] = useState<KenyanPayStub[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<KenyanPayrollRecord[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankingDialogOpen, setBankingDialogOpen] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [updatingBankInfo, setUpdatingBankInfo] = useState(false);
  const [updatingTaxInfo, setUpdatingTaxInfo] = useState(false);

  // Load employee payroll data using centralized service
  useEffect(() => {
    const loadPayrollData = async () => {
      if (!user?.employeeId) return;
      try {
        setLoading(true);
        // Load employee info and pay stubs
        const [employeeData, generatedPayStubs] = await Promise.all([
          PayrollDataService.getEmployeeInfo(user),
          PayrollDataService.generateEmployeePayStubs(user, selectedYear)
        ]);
        setEmployeeInfo(employeeData || null);
        setPayStubs(generatedPayStubs);
        toast({
          title: "Success",
          description: "Payroll data loaded successfully.",
          variant: "default"
        });
      } catch (error) {
        console.error('Failed to load payroll data:', error);
        toast({
          title: "Error",
          description: "Failed to load payroll data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadPayrollData();
  }, [user, selectedYear, toast]);

  // Calculate YTD totals from pay stubs
  const payrollSummary = {
    currentYear: parseInt(selectedYear),
    ytdGrossPay: payStubs && payStubs.length > 0 ? payStubs.reduce((sum, stub) => sum + (stub.grossPay || 0), 0) : 0,
    ytdNetPay: payStubs && payStubs.length > 0 ? payStubs.reduce((sum, stub) => sum + (stub.netPay || 0), 0) : 0,
    ytdPaye: payStubs && payStubs.length > 0 ? payStubs.reduce((sum, stub) => sum + (stub.paye || 0), 0) : 0,
    ytdNssf: payStubs && payStubs.length > 0 ? payStubs.reduce((sum, stub) => sum + (stub.nssf || 0), 0) : 0,
    ytdNhif: payStubs && payStubs.length > 0 ? payStubs.reduce((sum, stub) => sum + (stub.nhif || 0), 0) : 0,
    ytdOtherDeductions: payStubs && payStubs.length > 0 ? payStubs.reduce((sum, stub) => sum + (stub.totalOtherDeductions || 0), 0) : 0,
    lastPayAmount: payStubs && payStubs.length > 0 ? (payStubs[0].netPay || 0) : 0,
    lastPayDate: payStubs && payStubs.length > 0 ? (payStubs[0].payDate || '') : '',
    nextPayDate: ''
  };

  const taxDocuments = [
    { id: 1, type: 'P9 Form', year: 2023, status: 'Available', downloadUrl: '#' },
    { id: 2, type: 'P9 Form', year: 2022, status: 'Available', downloadUrl: '#' },
    { id: 3, type: 'Certificate of Service', year: 2023, status: 'Available', downloadUrl: '#' }
  ];

  const handleDownloadPayStub = async (payStub: KenyanPayStub) => {
    try {
      // await api.payroll.downloadPayStub(payStub.id);
      toast({
        title: "Download Started",
        description: "Your pay stub is being downloaded."
      });
    } catch (error) {
      console.error('Failed to download pay stub:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download pay stub. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewPayStub = (payStub: KenyanPayStub) => {
    setSelectedPayStub(payStub);
  };

  const handleDownloadTaxDocument = (doc: typeof taxDocuments[0]) => {
    console.log('Downloading tax document:', doc);
    toast({
      title: "Download Started",
      description: `Downloading ${doc.type} for ${doc.year}.`
    });
  };

  const handleUpdateBankingInfo = async (data: { bankName: string; accountNumber: string; accountType: string }) => {
    try {
      setUpdatingBankInfo(true);
      
      if (!user?.employeeId) {
        throw new Error('Employee ID not found');
      }
      
      // Use centralized payroll data service
      const success = await PayrollDataService.updateEmployeeBankingInfo(user.employeeId, data);
      
      if (success) {
        toast({
          title: "Success",
          description: "Banking information updated successfully.",
          variant: "default"
        });
        setBankingDialogOpen(false);
      } else {
        throw new Error('Update failed');
      }
      
    } catch (error) {
      console.error('Failed to update banking info:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update banking information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingBankInfo(false);
    }
  };

  const handleUpdateTaxInfo = async (data: { kraPin: string; nssfNumber: string; nhifNumber: string }) => {
    try {
      setUpdatingTaxInfo(true);
      
      if (!user?.employeeId) {
        throw new Error('Employee ID not found');
      }
      
      // Use centralized payroll data service
      const success = await PayrollDataService.updateEmployeeTaxInfo(user.employeeId, data);
      
      if (success) {
        toast({
          title: "Success",
          description: "Tax information updated successfully.",
          variant: "default"
        });
        setTaxDialogOpen(false);
      } else {
        throw new Error('Update failed');
      }
      
    } catch (error) {
      console.error('Failed to update tax info:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update tax information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingTaxInfo(false);
    }
  };

  if (loading || !employeeInfo) {
    return (
      <DashboardLayout title="My Payroll">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{loading ? 'Loading payroll data...' : 'No payroll data found for this employee.'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Payroll">
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="paystubs">Pay Stubs</TabsTrigger>
            <TabsTrigger value="tax-documents">Tax Documents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Employee Info */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Information</CardTitle>
                <CardDescription>Your current employment and payroll details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Employee ID</div>
                    <div className="font-medium">{employeeInfo.employeeId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Department</div>
                    <div className="font-medium">{employeeInfo.department}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div className="font-medium">{employeeInfo.position}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Branch</div>
                    <div className="font-medium">{employeeInfo.branch}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hire Date</div>
                    <div className="font-medium">{employeeInfo.hireDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Pay Frequency</div>
                    <div className="font-medium">{employeeInfo.payFrequency}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">KRA PIN</div>
                    <div className="font-medium font-mono">{employeeInfo.kraPin}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">NSSF Number</div>
                    <div className="font-medium font-mono">{employeeInfo.nssfNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">NHIF Number</div>
                    <div className="font-medium font-mono">{employeeInfo.nhifNumber}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payroll Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YTD Gross Pay</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.ytdGrossPay)}</div>
                  <p className="text-xs text-muted-foreground">Year {payrollSummary.currentYear}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YTD Net Pay</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrencyCompact(payrollSummary.ytdNetPay)}</div>
                  <p className="text-xs text-muted-foreground">After taxes & deductions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YTD PAYE Tax</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.ytdPaye)}</div>
                  <p className="text-xs text-muted-foreground">Income tax paid</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YTD Statutory</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrencyCompact(payrollSummary.ytdNssf + payrollSummary.ytdNhif)}</div>
                  <p className="text-xs text-muted-foreground">NSSF + NHIF contributions</p>
                </CardContent>
              </Card>
            </div>

            {/* Statutory Contributions Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">PAYE Tax</CardTitle>
                  <CardDescription>Income tax contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrencyCompact(payrollSummary.ytdPaye)}</div>
                  <p className="text-xs text-muted-foreground">Paid to Kenya Revenue Authority</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">NSSF Contributions</CardTitle>
                  <CardDescription>Social security fund</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrencyCompact(payrollSummary.ytdNssf)}</div>
                  <p className="text-xs text-muted-foreground">Retirement savings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">NHIF Contributions</CardTitle>
                  <CardDescription>Health insurance fund</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrencyCompact(payrollSummary.ytdNhif)}</div>
                  <p className="text-xs text-muted-foreground">Health coverage</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Pay Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Last Pay Period</CardTitle>
                  <CardDescription>Most recent paycheck information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Pay Date:</span>
                      <span className="text-sm font-medium">{payrollSummary.lastPayDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Net Amount:</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrencyCompact(payrollSummary.lastPayAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payment Method:</span>
                      <span className="text-sm font-medium">{employeeInfo.paymentMethod}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Pay Date</CardTitle>
                  <CardDescription>Upcoming payroll information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Next Pay Date:</span>
                      <span className="text-sm font-medium">{payrollSummary.nextPayDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pay Frequency:</span>
                      <span className="text-sm font-medium">{employeeInfo.payFrequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="paystubs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pay Stubs</h3>
                <p className="text-sm text-muted-foreground">View and download your Kenyan pay stubs</p>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>PAYE</TableHead>
                      <TableHead>NSSF</TableHead>
                      <TableHead>NHIF</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payStubs.map((payStub) => (
                      <TableRow key={payStub.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payStub.payPeriodStart} - {payStub.payPeriodEnd}</div>
                            <div className="text-sm text-muted-foreground">Period ID: {payStub.payrollPeriodId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{payStub.payDate}</TableCell>
                        <TableCell>{formatCurrencyCompact(payStub.grossPay)}</TableCell>
                        <TableCell>{formatCurrencyCompact(payStub.paye)}</TableCell>
                        <TableCell>{formatCurrencyCompact(payStub.nssf)}</TableCell>
                        <TableCell>{formatCurrencyCompact(payStub.nhif)}</TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrencyCompact(payStub.netPay)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewPayStub(payStub)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Kenyan Pay Stub Details</DialogTitle>
                                </DialogHeader>
                                {selectedPayStub && (
                                  <div className="space-y-6">
                                    {/* Employee Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Employee Information</h4>
                                        <div className="space-y-1 text-sm">
                                          <div><strong>Name:</strong> {selectedPayStub.employeeName}</div>
                                          <div><strong>Employee ID:</strong> {selectedPayStub.employeeId}</div>
                                          <div><strong>KRA PIN:</strong> {selectedPayStub.kraPin}</div>
                                          <div><strong>NSSF Number:</strong> {selectedPayStub.nssfNumber}</div>
                                          <div><strong>NHIF Number:</strong> {selectedPayStub.nhifNumber}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">Pay Period</h4>
                                        <div className="space-y-1 text-sm">
                                          <div><strong>Period:</strong> {selectedPayStub.payPeriodStart} to {selectedPayStub.payPeriodEnd}</div>
                                          <div><strong>Pay Date:</strong> {selectedPayStub.payDate}</div>
                                          <div><strong>Period ID:</strong> {selectedPayStub.payrollPeriodId}</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Earnings */}
                                    <div>
                                      <h4 className="font-semibold mb-2">Earnings</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                          <span>Basic Salary:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.basicSalary)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Allowances:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.allowances)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Overtime:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.overtime)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                          <span>Gross Pay:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.grossPay)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Statutory Deductions */}
                                    <div>
                                      <h4 className="font-semibold mb-2">Statutory Deductions</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                          <span>PAYE Tax:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.paye)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>NSSF Contribution:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.nssf)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>NHIF Contribution:</span>
                                          <span>{formatCurrencyCompact(selectedPayStub.nhif)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Other Deductions */}
                                    {selectedPayStub.otherDeductions.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold mb-2">Other Deductions</h4>
                                        <div className="space-y-2 text-sm">
                                          {selectedPayStub.otherDeductions.map((deduction) => (
                                            <div key={deduction.id} className="flex justify-between">
                                              <span>{deduction.name}:</span>
                                              <span>{formatCurrencyCompact(deduction.amount)}</span>
                                            </div>
                                          ))}
                                          <div className="flex justify-between font-semibold border-t pt-2">
                                            <span>Total Other Deductions:</span>
                                            <span>{formatCurrencyCompact(selectedPayStub.totalOtherDeductions)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Net Pay */}
                                    <div className="border-t pt-4">
                                      <div className="flex justify-between text-lg font-bold">
                                        <span>Net Pay:</span>
                                        <span className="text-green-600">{formatCurrencyCompact(selectedPayStub.netPay)}</span>
                                      </div>
                                    </div>

                                    <div className="flex justify-end">
                                      <Button onClick={() => handleDownloadPayStub(selectedPayStub)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadPayStub(payStub)}
                            >
                              <Download className="h-4 w-4" />
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

          <TabsContent value="tax-documents" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Tax Documents</h3>
              <p className="text-sm text-muted-foreground">Download your Kenyan tax forms and documents</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                P9 forms are generated annually and contain your complete tax information for KRA filing.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Tax Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.type}</TableCell>
                        <TableCell>{doc.year}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{doc.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadTaxDocument(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Payroll Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your payroll preferences and information</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Bank Account</span>
                  </CardTitle>
                  <CardDescription>Manage your bank account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Bank Account:</span>
                      <span className="text-sm font-medium">{employeeInfo.bankAccount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Account Type:</span>
                      <span className="text-sm font-medium">Checking</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBankingDialogOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Banking Info
                    </Button>
                    
                    <Dialog open={bankingDialogOpen} onOpenChange={setBankingDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Banking Information</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          handleUpdateBankingInfo({
                            bankName: formData.get('bankName') as string,
                            accountNumber: formData.get('accountNumber') as string,
                            accountType: formData.get('accountType') as string
                          });
                        }}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="bankName">Bank Name</Label>
                              <Input 
                                id="bankName"
                                name="bankName"
                                defaultValue="Kenya Commercial Bank"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="accountNumber">Account Number</Label>
                              <Input 
                                id="accountNumber"
                                name="accountNumber"
                                defaultValue={employeeInfo.bankAccount.replace('*', '1')}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="accountType">Account Type</Label>
                              <Select name="accountType" defaultValue="Checking">
                                <SelectTrigger id="accountType">
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Checking">Checking</SelectItem>
                                  <SelectItem value="Savings">Savings</SelectItem>
                                  <SelectItem value="Current">Current</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setBankingDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updatingBankInfo}
                            >
                              {updatingBankInfo ? 'Updating...' : 'Save Changes'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Tax Information</span>
                  </CardTitle>
                  <CardDescription>Your Kenyan tax registration details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">KRA PIN:</span>
                      <span className="text-sm font-medium font-mono">{employeeInfo.kraPin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">NSSF Number:</span>
                      <span className="text-sm font-medium font-mono">{employeeInfo.nssfNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">NHIF Number:</span>
                      <span className="text-sm font-medium font-mono">{employeeInfo.nhifNumber}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTaxDialogOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Tax Info
                    </Button>
                    
                    <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Tax Information</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          handleUpdateTaxInfo({
                            kraPin: formData.get('kraPin') as string,
                            nssfNumber: formData.get('nssfNumber') as string,
                            nhifNumber: formData.get('nhifNumber') as string
                          });
                        }}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="kraPin">KRA PIN</Label>
                              <Input 
                                id="kraPin"
                                name="kraPin"
                                className="font-mono"
                                defaultValue={employeeInfo.kraPin}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="nssfNumber">NSSF Number</Label>
                              <Input 
                                id="nssfNumber"
                                name="nssfNumber"
                                className="font-mono"
                                defaultValue={employeeInfo.nssfNumber}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="nhifNumber">NHIF Number</Label>
                              <Input 
                                id="nhifNumber"
                                name="nhifNumber"
                                className="font-mono"
                                defaultValue={employeeInfo.nhifNumber}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setTaxDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updatingTaxInfo}
                            >
                              {updatingTaxInfo ? 'Updating...' : 'Save Changes'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeePayroll;
