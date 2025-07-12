import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Eye, Calendar } from 'lucide-react';
import { KenyanPayStub } from '@/types/payroll';
import { formatCurrencyCompact } from '@/utils/currency';

interface PayStubViewerProps {
  payStub: KenyanPayStub;
  onDownload?: () => void;
  onView?: () => void;
}

const PayStubViewer = ({ payStub, onDownload, onView }: PayStubViewerProps) => {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Pay Stub</CardTitle>
            <CardDescription>
              Pay Period: {payStub.payPeriodStart} to {payStub.payPeriodEnd}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Pay Date: {payStub.payDate}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Employee Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">EMPLOYEE INFORMATION</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Name:</span>
                <span className="text-sm font-medium">{payStub.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Employee ID:</span>
                <span className="text-sm font-medium">{payStub.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">KRA PIN:</span>
                <span className="text-sm font-medium">{payStub.kraPin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NSSF Number:</span>
                <span className="text-sm font-medium">{payStub.nssfNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NHIF Number:</span>
                <span className="text-sm font-medium">{payStub.nhifNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">PAY PERIOD</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Period Start:</span>
                <span className="text-sm font-medium">{payStub.payPeriodStart}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Period End:</span>
                <span className="text-sm font-medium">{payStub.payPeriodEnd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pay Date:</span>
                <span className="text-sm font-medium">{payStub.payDate}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Earnings Section */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">EARNINGS</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Basic Salary</span>
              <span className="text-sm font-medium">{formatCurrencyCompact(payStub.basicSalary)}</span>
            </div>
            
            {payStub.allowances > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Allowances</span>
                <span className="text-sm font-medium">{formatCurrencyCompact(payStub.allowances)}</span>
              </div>
            )}
            
            {payStub.overtime > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Overtime Pay</span>
                <span className="text-sm font-medium">{formatCurrencyCompact(payStub.overtime)}</span>
              </div>
            )}
            
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span className="text-sm">Gross Pay</span>
              <span className="text-sm">{formatCurrencyCompact(payStub.grossPay)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Taxes and Deductions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Statutory Deductions */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">STATUTORY DEDUCTIONS</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">PAYE (Income Tax)</span>
                <span className="text-sm font-medium">{formatCurrencyCompact(payStub.paye)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NSSF</span>
                <span className="text-sm font-medium">{formatCurrencyCompact(payStub.nssf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NHIF</span>
                <span className="text-sm font-medium">{formatCurrencyCompact(payStub.nhif)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span className="text-sm">Total Statutory Deductions</span>
                <span className="text-sm">{formatCurrencyCompact(payStub.paye + payStub.nssf + payStub.nhif)}</span>
              </div>
            </div>
          </div>

          {/* Other Deductions */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">OTHER DEDUCTIONS</h3>
            <div className="space-y-2">
              {payStub.otherDeductions && payStub.otherDeductions.length > 0 ? (
                payStub.otherDeductions.map((deduction) => (
                  <div key={deduction.id} className="flex justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm">{deduction.name}</span>
                      {deduction.type && (
                        <span className="text-xs text-muted-foreground">{deduction.type}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{formatCurrencyCompact(deduction.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No other deductions</div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span className="text-sm">Total Other Deductions</span>
                <span className="text-sm">{formatCurrencyCompact(payStub.totalOtherDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Net Pay */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Net Pay</span>
            <span className="text-2xl font-bold text-green-600">{formatCurrencyCompact(payStub.netPay)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <span>Total Deductions: {formatCurrencyCompact(payStub.totalDeductions)}</span>
            <span>Gross Pay: {formatCurrencyCompact(payStub.grossPay)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4">
          {onView && (
            <Button variant="outline" onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
          {onDownload && (
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PayStubViewer;
