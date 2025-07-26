import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  Printer, 
  Mail, 
  FileText, 
  Calendar,
  Building,
  User,
  CreditCard,
  Calculator
} from 'lucide-react';
import { payrollService } from '@/services/api/payroll.service';

const PayStubViewer = () => {
  const [selectedPayStub, setSelectedPayStub] = useState('paystub_001_2024_12');
  const [payStub, setPayStub] = useState(null);

  useEffect(() => {
    const fetchPayStub = async () => {
      try {
        // Replace with your real API call for pay stub
        const stubs = await payrollService.getPayStubs();
        const data = stubs.find((stub: any) => stub.id === selectedPayStub);
        setPayStub(data);
      } catch (error) {
        setPayStub(null);
      }
    };
    fetchPayStub();
  }, [selectedPayStub]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!payStub) {
    return (
      <DashboardLayout title="Pay Stub Viewer">
        <div className="p-8">
          <p className="text-center text-gray-500">Loading pay stub data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalAllowances = payStub && payStub.allowances ? Object.values(payStub.allowances as Record<string, number>).reduce((sum, amount) => sum + amount, 0) : 0;
  const totalStatutoryDeductions = payStub.paye + payStub.nssf + payStub.nhif;

  return (
    <DashboardLayout title="Pay Stub Viewer">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pay Stub - {payStub.employeeName}</CardTitle>
                <CardDescription>
                  Pay Period: {payStub.payPeriodStart} to {payStub.payPeriodEnd}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Pay Stub Content */}
        <div className="bg-white border rounded-lg p-8 space-y-8">
          {/* Company Header */}
          <div className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold text-gray-900">{payStub.companyName}</h1>
            <p className="text-gray-600">{payStub.companyAddress}</p>
            <p className="text-sm text-gray-500">KRA PIN: {payStub.companyPin}</p>
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-800">PAYSLIP</h2>
              <p className="text-gray-600">Pay Period: {payStub.payPeriodStart} to {payStub.payPeriodEnd}</p>
            </div>
          </div>

          {/* Employee Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{payStub.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Employee ID:</span>
                  <span className="text-sm">{payStub.employeeName || payStub.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Department:</span>
                  <span className="text-sm">{payStub.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Position:</span>
                  <span className="text-sm">{payStub.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">KRA PIN:</span>
                  <span className="text-sm">{payStub.kraPin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">NSSF No:</span>
                  <span className="text-sm">{payStub.nssfNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">NHIF No:</span>
                  <span className="text-sm">{payStub.nhifNumber}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Pay Date:</span>
                  <span className="text-sm">{payStub.payDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Bank:</span>
                  <span className="text-sm">{payStub.bankAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Account No:</span>
                  <span className="text-sm">{payStub.bankAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Branch Code:</span>
                  <span className="text-sm">{payStub.bankAccount.branchCode}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-semibold text-green-600">
                  <span className="text-sm">Net Pay:</span>
                  <span className="text-lg">{formatCurrency(payStub.netPay)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings and Deductions */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Earnings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-green-600" />
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount (KSH)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Basic Salary</TableCell>
                      <TableCell className="text-right">{payStub.basicSalary.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>House Allowance</TableCell>
                      <TableCell className="text-right">{payStub.allowances.houseAllowance.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Transport Allowance</TableCell>
                      <TableCell className="text-right">{payStub.allowances.transportAllowance.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Medical Allowance</TableCell>
                      <TableCell className="text-right">{payStub.allowances.medicalAllowance.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Overtime Allowance</TableCell>
                      <TableCell className="text-right">{payStub.allowances.overtimeAllowance.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">Gross Pay</TableCell>
                      <TableCell className="text-right font-bold">{payStub.grossPay.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-red-600" />
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount (KSH)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PAYE Tax</TableCell>
                      <TableCell className="text-right">{payStub.paye.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>NSSF Contribution</TableCell>
                      <TableCell className="text-right">{payStub.nssf.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>NHIF Contribution</TableCell>
                      <TableCell className="text-right">{payStub.nhif.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-medium">Statutory Deductions</TableCell>
                      <TableCell className="text-right font-medium">{totalStatutoryDeductions.toLocaleString()}</TableCell>
                    </TableRow>
                    {payStub.otherDeductions.map((deduction, index) => (
                      <TableRow key={index}>
                        <TableCell>{deduction.name}</TableCell>
                        <TableCell className="text-right">{deduction.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">Total Deductions</TableCell>
                      <TableCell className="text-right font-bold">{payStub.totalDeductions.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-xl text-center">Pay Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(payStub.grossPay)}</div>
                  <div className="text-sm text-gray-600">Gross Pay</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(payStub.totalDeductions)}</div>
                  <div className="text-sm text-gray-600">Total Deductions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{formatCurrency(payStub.netPay)}</div>
                  <div className="text-sm text-gray-600">Net Pay</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Year to Date Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Year to Date Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5 text-center">
                <div>
                  <div className="text-lg font-bold">{formatCurrency(payStub.ytdGrossPay)}</div>
                  <div className="text-sm text-gray-600">YTD Gross</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatCurrency(payStub.ytdPaye)}</div>
                  <div className="text-sm text-gray-600">YTD PAYE</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatCurrency(payStub.ytdNssf)}</div>
                  <div className="text-sm text-gray-600">YTD NSSF</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatCurrency(payStub.ytdNhif)}</div>
                  <div className="text-sm text-gray-600">YTD NHIF</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(payStub.ytdNetPay)}</div>
                  <div className="text-sm text-gray-600">YTD Net Pay</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p>For any queries, please contact the HR Department.</p>
          </div>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Additional actions for this pay stub</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Pay Stub
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email to Employee
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate P9 Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PayStubViewer;
