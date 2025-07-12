import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrencyCompact } from '@/utils/currency';
import { api } from '@/services/unifiedApi';
import { SalaryAdvanceRequest } from '@/types/types';
import { PayrollEngine } from '@/services/payrollEngine';
import { PayrollDataService } from '@/services/payrollDataService';

const SalaryAdvanceManagement = () => {
  const { toast } = useToast();
  const [advances, setAdvances] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvanceRequest | null>(null);
  const [payrollInfo, setPayrollInfo] = useState<any>(null);

  // Fetch all salary advance requests from backend
  useEffect(() => {
    const loadSalaryAdvanceRequests = async () => {
      try {
        setLoading(true);
        const requests = await api.data.getSalaryAdvanceRequests('hr');
        setAdvances(requests);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load salary advance requests.',
          variant: 'destructive',
        });
        setAdvances([]);
      } finally {
        setLoading(false);
      }
    };
    loadSalaryAdvanceRequests();
  }, [toast]);

  // Fetch payroll info for selected employee
  useEffect(() => {
    const fetchPayrollInfo = async () => {
      if (selectedAdvance) {
        try {
          const employee = await PayrollDataService.getEmployeePayrollInfo(String(selectedAdvance.employeeId));
          setPayrollInfo(employee?.payrollInfo || null);
        } catch {
          setPayrollInfo(null);
        }
      }
    };
    fetchPayrollInfo();
  }, [selectedAdvance]);

  // Example: Calculate monthly salary and eligibility
  const monthlySalary = useMemo(() => {
    if (!selectedAdvance) return 0;
    return selectedAdvance.hrEligibilityDetails?.currentSalary || payrollInfo?.monthlySalary || 0;
  }, [selectedAdvance, payrollInfo]);

  // Example: Calculate max advance and available credit
  const maxAdvanceLimit = useMemo(() => PayrollEngine.calculateMaxAdvanceLimit(monthlySalary), [monthlySalary]);
  const outstandingAdvances = selectedAdvance?.repaymentDetails?.remainingBalance || 0;
  const availableCredit = useMemo(() => PayrollEngine.calculateAvailableCredit(monthlySalary, outstandingAdvances), [monthlySalary, outstandingAdvances]);
  const isEligible = selectedAdvance ? (selectedAdvance.amount <= maxAdvanceLimit && availableCredit >= selectedAdvance.amount) : false;

  return (
    <DashboardLayout title="Salary Advance Management">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Salary Advance Requests</CardTitle>
            <CardDescription>Review and manage all salary advance requests from employees.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>{advance.employeeName}</TableCell>
                      <TableCell>{formatCurrencyCompact(advance.amount)}</TableCell>
                      <TableCell>{advance.status}</TableCell>
                      <TableCell>{advance.requestDate ? new Date(advance.requestDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedAdvance(advance)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        {selectedAdvance && (
          <Dialog open={!!selectedAdvance} onOpenChange={() => setSelectedAdvance(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Advance Details for {selectedAdvance.employeeName}</DialogTitle>
                <DialogDescription>Review eligibility and payroll info.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-xs text-muted-foreground">Current Salary</label>
                  <p className="text-sm font-medium">{formatCurrencyCompact(monthlySalary)}/month</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max Advance Eligible</label>
                  <p className="text-sm font-medium">{formatCurrencyCompact(maxAdvanceLimit)} (50% of salary)</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Outstanding Advances</label>
                  <p className="text-sm font-medium">{formatCurrencyCompact(outstandingAdvances)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Available Credit</label>
                  <p className="text-sm font-medium">{formatCurrencyCompact(availableCredit)}</p>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Eligibility Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {isEligible ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" /> Eligible for salary advance
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" /> Exceeds credit limit
                    </Badge>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SalaryAdvanceManagement;
