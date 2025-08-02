import { useState, useEffect, useCallback } from 'react';
import PeriodSelector from '@/components/PeriodSelector';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  RefreshCw,
  Calendar,
  Trash2
} from 'lucide-react';
import { payrollService } from '@/services/api/payroll.service';
import { formatCurrencyCompact } from '@/utils/currency';
import { normalizeDateForInput, normalizeToISO } from '@/utils/dateUtils';
import PayrollPieChart from '@/components/PayrollPieChart';
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
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch periods and payroll records from backend
  const fetchPeriodsAndRecords = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch periods
      const periodsRes = await payrollService.getPayrollPeriods();
      const periodsList = periodsRes.data || [];
      if (!Array.isArray(periodsList)) {
        toast({ title: 'Error loading payroll data', description: 'Payroll periods response is not an array.', variant: 'destructive' });
        setPeriods([]);
        setCurrentPeriod(null);
        setPayrollRecords([]);
        setLoading(false);
        return;
      }
      setPeriods(periodsList);
      // Pick the latest or active period
      let active = periodsList.find((p: PayrollPeriod) => p.status === 'approved' || p.status === 'processing') || periodsList[0] || null;
      setCurrentPeriod(active);
      if (active) {
        // Fetch payroll records for the period
        const recordsRes = await payrollService.getPayrollRecords({ periodId: active.id });
        let records = recordsRes.data || [];
        
        console.log('Raw payroll records response:', recordsRes);
        console.log('Extracted records:', records);
        
        // The backend returns { status: 'success', data: [...], pagination: {...} }
        // So we need to use recordsRes.data directly
        if (Array.isArray(records)) {
          setPayrollRecords(records);
          console.log(`Set ${records.length} payroll records`);
        } else {
          console.error('Payroll records is not an array:', records);
          setPayrollRecords([]);
        }
      } else {
        setPayrollRecords([]);
      }
    } catch (err: any) {
      toast({ title: 'Error loading payroll data', description: err.message || String(err), variant: 'destructive' });
      setPayrollRecords([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchPeriodsAndRecords();
  }, [fetchPeriodsAndRecords]);

  // Handler for period change
  const handlePeriodChange = async (periodId: string) => {
    const period = periods.find(p => p.id === periodId) || null;
    setCurrentPeriod(period);
    setLoading(true);
    try {
      if (period) {
        const recordsRes = await payrollService.getPayrollRecords({ periodId: period.id });
        const records = recordsRes.data || [];
        console.log('Period switch - loaded records:', records);
        if (Array.isArray(records)) {
          setPayrollRecords(records);
        } else {
          console.error('Period switch - records is not an array:', records);
          setPayrollRecords([]);
        }
      } else {
        setPayrollRecords([]);
      }
    } catch (err: any) {
      toast({ title: 'Error loading payroll data', description: err.message || String(err), variant: 'destructive' });
      setPayrollRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Stat Cards Section ---
  const statCards = [
    {
      title: 'Current Pay Period',
      value: currentPeriod ? currentPeriod.name : 'No Active Period',
      description: currentPeriod && currentPeriod.startDate && currentPeriod.endDate && currentPeriod.payDate
        ? `${new Date(currentPeriod.startDate).toLocaleDateString()} - ${new Date(currentPeriod.endDate).toLocaleDateString()} (Pay: ${new Date(currentPeriod.payDate).toLocaleDateString()})`
        : 'No payroll period selected',
      icon: Calendar,
      status: 'active'
    },
    {
      title: 'Total Employees',
      value: payrollRecords.length.toString(),
      description: 'Active payroll employees',
      icon: Users,
      status: 'info'
    },
    {
      title: 'Gross Payroll',
      value: formatCurrencyCompact(payrollRecords.reduce((sum, r) => sum + (typeof r.grossSalary === 'number' ? r.grossSalary : 0), 0)),
      description: 'Current period total',
      icon: DollarSign,
      status: 'success'
    },
    {
      title: 'Net Payroll',
      value: formatCurrencyCompact(payrollRecords.reduce((sum, r) => sum + (typeof r.netSalary === 'number' ? r.netSalary : 0), 0)),
      description: 'After statutory deductions',
      icon: Calculator,
      status: 'success'
    }
  ];

  // ...existing code...

  // Modal state for editing/creating periods
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodModalMode, setPeriodModalMode] = useState<'edit' | 'create'>('edit');
  const [periodForm, setPeriodForm] = useState<any>(null);
  const [periodModalLoading, setPeriodModalLoading] = useState(false);

  // Open modal for editing/creating period
  const openEditPeriod = () => {
    setPeriodModalMode('edit');
    setPeriodForm(currentPeriod);
    setShowPeriodModal(true);
  };
  const openCreatePeriod = () => {
    setPeriodModalMode('create');
    setPeriodForm({ name: '', startDate: '', endDate: '', payDate: '' });
    setShowPeriodModal(true);
  };

  // Save period (edit or create)
  const handleSavePeriod = async () => {
    setPeriodModalLoading(true);
    try {
      if (periodModalMode === 'edit' && periodForm?.id) {
        await payrollService.updatePayrollPeriod(periodForm.id, periodForm);
        toast({ title: 'Payroll period updated' });
      } else if (periodModalMode === 'create') {
        await payrollService.createPayrollPeriod(periodForm);
        toast({ title: 'Payroll period created' });
      }
      // Refresh periods
      const periodsRes = await payrollService.getPayrollPeriods();
      const periodsList = periodsRes.data || [];
      setPeriods(periodsList);
      let active = periodsList.find((p: PayrollPeriod) => p.status === 'approved' || p.status === 'processing') || periodsList[0] || null;
      setCurrentPeriod(active);
      setShowPeriodModal(false);
    } catch (err: any) {
      toast({ title: 'Failed to save period', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setPeriodModalLoading(false);
    }
  };

  // Animate the stepper in sync with backend steps
  const animateStepperAndProcess = async () => {
    setLoading(true);
    setProcessingStep(0);
    try {
      // Step 1: Review & Approve Time Entries
      setProcessingStep(0);
      await new Promise(res => setTimeout(res, 800));
      // Step 2: Verify Compensation & Statutory
      setProcessingStep(1);
      await new Promise(res => setTimeout(res, 800));
      // Step 3: Run Payroll Calculations (backend call)
      setProcessingStep(2);
      // Use the correct backend endpoint for bulk payroll processing
      await payrollService.bulkProcessPayroll(currentPeriod.id);
      // Step 4: Review & Resolve Exceptions
      setProcessingStep(3);
      await new Promise(res => setTimeout(res, 800));
      // Step 5: Submit for Approval
      setProcessingStep(4);
      await new Promise(res => setTimeout(res, 800));
      // Step 6: Generate Pay Slips
      setProcessingStep(5);
      await new Promise(res => setTimeout(res, 800));
      // Step 7: Process Payments & Remittances
      setProcessingStep(6);
      await new Promise(res => setTimeout(res, 800));
      toast({ title: 'Payroll processed for period' });
      // Refresh payroll records
      const recordsRes = await payrollService.getPayrollRecords({ periodId: currentPeriod.id });
      const refreshedRecords = recordsRes.data || [];
      console.log('Refreshed payroll records after processing:', refreshedRecords);
      if (Array.isArray(refreshedRecords)) {
        setPayrollRecords(refreshedRecords);
        console.log(`Refreshed to ${refreshedRecords.length} payroll records`);
      } else {
        console.error('Refreshed payroll records is not an array:', refreshedRecords);
        setPayrollRecords([]);
      }
    } catch (err: any) {
      toast({ title: 'Failed to process payroll', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!currentPeriod) return;
    await animateStepperAndProcess();
  };

  // Delete all payroll records for current period
  const handleDeleteAllRecords = async () => {
    if (!currentPeriod) {
      toast({ title: 'No period selected', variant: 'destructive' });
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ALL payroll records for period "${currentPeriod.name}"? This action cannot be undone.`
    );

    if (!confirmation) return;

    setLoading(true);
    try {
      await payrollService.deletePayrollRecordsByPeriod(currentPeriod.id);
      toast({ 
        title: 'Records deleted', 
        description: `All payroll records for period "${currentPeriod.name}" have been deleted.`
      });
      
      // Refresh payroll records
      const recordsRes = await payrollService.getPayrollRecords({ periodId: currentPeriod.id });
      const records = recordsRes.data || [];
      if (Array.isArray(records)) {
        setPayrollRecords(records);
      } else {
        setPayrollRecords([]);
      }
    } catch (err: any) {
      toast({ 
        title: 'Failed to delete records', 
        description: err.message || String(err), 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Payroll Processing">
      {/* Calendar dropdown visibility and color fix for dark mode */}
      <style>{`
        /* Modal and input backgrounds: midnight color in dark mode */
        [data-theme="dark"] .modal-midnight,
        [data-theme="dark"] .modal-midnight input,
        [data-theme="dark"] .modal-midnight input[type="date"] {
          background-color: #181824 !important;
          color: #fff !important;
          border-color: #232326 !important;
        }
        /* Cancel button: midnight color in dark mode */
        [data-theme="dark"] .modal-midnight .btn-cancel {
          background-color: #181824 !important;
          color: #fff !important;
          border: 1px solid #232326 !important;
        }
        [data-theme="dark"] .modal-midnight .btn-cancel:hover {
          background-color: #232326 !important;
        }
        /* Calendar icon: white in dark mode */
        [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          background-color: #181824 !important;
          border-radius: 4px;
          border: 1px solid #232326;
        }
        [data-theme="dark"] input[type="date"] {
          color-scheme: dark;
          background-color: #181824;
          color: #fff;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }
        /* For Firefox */
        [data-theme="dark"] input[type="date"]::-moz-focus-inner {
          color: #fff;
        }
        [data-theme="dark"] input[type="date"]::-moz-calendar-picker-indicator {
          filter: brightness(0) invert(1) !important;
          background-color: #181824 !important;
          border-radius: 4px;
          border: 1px solid #232326;
        }
      `}</style>
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
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

        {/* Setup/Edit/Create Period Actions */}
        <div className="flex gap-2 items-center">
          {currentPeriod ? (
            <Button variant="outline" onClick={openEditPeriod} disabled={loading}>Edit Period</Button>
          ) : (
            <Button variant="default" onClick={openCreatePeriod} disabled={loading}>Create Payroll Period</Button>
          )}
          <Button variant="default" onClick={handleProcessPayroll} disabled={loading || !currentPeriod}>Process Payroll</Button>
        </div>

        <PeriodSelector
          periods={Array.isArray(periods) ? periods : []}
          currentPeriod={currentPeriod}
          onChange={handlePeriodChange}
          loading={loading}
        />

        {/* Period Modal */}
        {showPeriodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm">
            <div className="modal-midnight bg-white dark:bg-[#181824] rounded-xl shadow-lg w-full max-w-lg border border-gray-200 dark:border-gray-800 focus:outline-none">
              <div className="px-8 pt-8 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{periodModalMode === 'edit' ? 'Edit Payroll Period' : 'Create Payroll Period'}</h2>
                  <button onClick={() => setShowPeriodModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold focus:outline-none">&times;</button>
                </div>
                <div className="text-sm mb-6 text-gray-500 dark:text-gray-300">{periodModalMode === 'edit' ? 'Update payroll period information.' : 'Create a new payroll period.'}</div>
                <form onSubmit={e => { e.preventDefault(); handleSavePeriod(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Name *</label>
                      <input className="w-full rounded-md px-3 py-2 bg-white dark:bg-[#181824] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:border-blue-400 focus:outline-none transition" placeholder="Period Name" value={periodForm?.name || ''} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Pay Date *</label>
                      <input className="w-full rounded-md px-3 py-2 bg-white dark:bg-[#181824] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:border-blue-400 focus:outline-none transition" type="date" placeholder="Pay Date" value={normalizeDateForInput(periodForm?.payDate)} onChange={e => setPeriodForm({ ...periodForm, payDate: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Start Date *</label>
                      <input className="w-full rounded-md px-3 py-2 bg-white dark:bg-[#181824] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:border-blue-400 focus:outline-none transition" type="date" placeholder="Start Date" value={normalizeDateForInput(periodForm?.startDate)} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">End Date *</label>
                      <input className="w-full rounded-md px-3 py-2 bg-white dark:bg-[#181824] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:border-blue-400 focus:outline-none transition" type="date" placeholder="End Date" value={normalizeDateForInput(periodForm?.endDate)} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex flex-row-reverse gap-3 mt-8 pb-4">
                    <Button
                      className="min-w-[140px] bg-gray-900 text-white dark:bg-white dark:text-black border-none hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      type="submit"
                      disabled={periodModalLoading}
                    >
                      {periodModalLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      className="btn-cancel min-w-[110px] bg-white dark:bg-[#181824] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#232326] focus:outline-none transition"
                      type="button"
                      onClick={() => setShowPeriodModal(false)}
                      disabled={periodModalLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflow">Processing Workflow</TabsTrigger>
            <TabsTrigger value="employees">Employee Records</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Processing Workflow Tab - Modern Animated Stepper */}
          <TabsContent value="workflow">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Processing Workflow</CardTitle>
                <CardDescription>Track your progress through each payroll step. Steps animate as you complete them.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-6">
                  {/* Animated Stepper */}
                  <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                    {[
                      'Review & Approve Time Entries',
                      'Verify Compensation & Statutory',
                      'Run Payroll Calculations',
                      'Review & Resolve Exceptions',
                      'Submit for Approval',
                      'Generate Pay Slips',
                      'Process Payments & Remittances'
                    ].map((step, idx, arr) => (
                      <div key={step} className="flex items-center w-full">
                        <div className={`relative flex flex-col items-center group w-full`}>
                          <div className={`transition-all duration-500 ease-in-out rounded-full border-4 
                            ${processingStep > idx ? 'border-green-500 bg-green-500' : processingStep === idx ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 animate-pulse' : 'border-gray-300 bg-white dark:bg-gray-900'}
                            w-10 h-10 flex items-center justify-center text-lg font-bold 
                            ${processingStep > idx ? 'text-white' : processingStep === idx ? 'text-blue-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{idx + 1}</div>
                          <span className="mt-2 text-xs text-center w-24 text-muted-foreground">{step}</span>
                          {idx < arr.length - 1 && (
                            <div className="absolute top-5 left-1/2 w-24 h-1 -translate-x-1/2 bg-gradient-to-r from-blue-200 to-blue-400 z-0"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex gap-2">
                  <Button variant="outline" disabled={loading || !currentPeriod} onClick={() => setProcessingStep(0)}>
                    Reset Workflow
                  </Button>
                  <Button variant="outline" disabled={loading || !currentPeriod}>Export Payroll Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Records Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Employee Payroll Records</CardTitle>
                    <CardDescription>Payroll calculations for each employee in the selected period.</CardDescription>
                  </div>
                  {payrollRecords.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAllRecords}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All Records
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">Loading payroll records...</div>
                ) : payrollRecords.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No payroll records found for this period.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>PAYE</TableHead>
                        <TableHead>NSSF</TableHead>
                        <TableHead>NHIF</TableHead>
                        <TableHead>Other Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {(() => {
                                // Prefer employee.firstName + lastName if present
                                let name = '';
                                if (record.employee && (record.employee.firstName || record.employee.lastName)) {
                                  name = `${record.employee.firstName || ''} ${record.employee.lastName || ''}`.trim();
                                } else {
                                  name = record.employeeName
                                    || (record.employee && (record.employee.name || record.employee.fullName))
                                    || '';
                                }
                                const initials = name
                                  ? name.split(' ').map(n => n[0]).join('').slice(0,2)
                                  : '?';
                                return <>
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                    {initials}
                                  </div>
                                  <span>{name || <span className="text-muted-foreground italic">No Name</span>}</span>
                                </>;
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrencyCompact(
                            typeof record.grossSalary === 'number' ? record.grossSalary :
                            typeof record.grossPay === 'number' ? record.grossPay : 0
                          )}</TableCell>
                          <TableCell>{formatCurrencyCompact(
                            (() => {
                              // Prefer statutoryDeductions if present
                              if (typeof record.statutoryDeductions?.paye === 'number') return record.statutoryDeductions.paye;
                              // Fallback: aggregate from payrollItems
                              if (Array.isArray(record.payrollItems)) {
                                return record.payrollItems
                                  .filter((item: any) => item.isStatutory && (item.name === 'PAYE' || item.name === 'Income Tax (PAYE)'))
                                  .reduce((sum: number, item: any) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0);
                              }
                              return 0;
                            })()
                          )}</TableCell>
                          <TableCell>{formatCurrencyCompact(
                            (() => {
                              if (typeof record.statutoryDeductions?.nssf === 'number') return record.statutoryDeductions.nssf;
                              if (Array.isArray(record.payrollItems)) {
                                return record.payrollItems
                                  .filter((item: any) => item.isStatutory && item.name === 'NSSF')
                                  .reduce((sum: number, item: any) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0);
                              }
                              return 0;
                            })()
                          )}</TableCell>
                          <TableCell>{formatCurrencyCompact(
                            (() => {
                              if (typeof record.statutoryDeductions?.nhif === 'number') return record.statutoryDeductions.nhif;
                              if (Array.isArray(record.payrollItems)) {
                                return record.payrollItems
                                  .filter((item: any) => item.isStatutory && item.name === 'NHIF')
                                  .reduce((sum: number, item: any) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0);
                              }
                              return 0;
                            })()
                          )}</TableCell>
                          <TableCell>{formatCurrencyCompact(typeof record.otherDeductions === 'number' ? record.otherDeductions : 0)}</TableCell>
                          <TableCell>{formatCurrencyCompact(
                            typeof record.netSalary === 'number' ? record.netSalary :
                            typeof record.netPay === 'number' ? record.netPay : 0
                          )}</TableCell>
                          <TableCell>
                            <Badge>{record.status}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2"
                              disabled={loading || !currentPeriod}
                              onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete and reprocess payroll for this employee and period?')) return;
                                try {
                                  setLoading(true);
                                  await payrollService.deletePayrollRecord(record.employeeId, record.payrollPeriodId);
                                  toast({ title: 'Payroll record deleted', description: 'You can now reprocess payroll for this employee.', variant: 'default' });
                                  // Refresh payroll records
                                  if (currentPeriod) {
                                    const recordsRes = await payrollService.getPayrollRecords({ periodId: currentPeriod.id });
                                    const records = recordsRes.data || [];
                                    if (Array.isArray(records)) {
                                      setPayrollRecords(records);
                                    } else {
                                      setPayrollRecords([]);
                                    }
                                  }
                                } catch (err: any) {
                                  toast({ title: 'Failed to delete payroll record', description: err.message || String(err), variant: 'destructive' });
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Reprocess Payroll
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="ml-2"
                              disabled={loading || !currentPeriod}
                              onClick={async () => {
                                if (!window.confirm('Process payroll for this employee?')) return;
                                try {
                                  setLoading(true);
                                  await payrollService.processPayrollForEmployee(currentPeriod.id, record.employeeId);
                                  toast({ title: 'Payroll processed', description: `Payroll processed for ${record.employeeName || 'employee'}` });
                                  // Refresh payroll records
                                  if (currentPeriod) {
                                    const recordsRes = await payrollService.getPayrollRecords({ periodId: currentPeriod.id });
                                    const records = recordsRes.data || [];
                                    if (Array.isArray(records)) {
                                      setPayrollRecords(records);
                                    } else {
                                      setPayrollRecords([]);
                                    }
                                  }
                                } catch (err: any) {
                                  toast({ title: 'Failed to process payroll', description: err.message || String(err), variant: 'destructive' });
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Process Payroll
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exceptions Tab */}
          <TabsContent value="exceptions">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Exceptions</CardTitle>
                <CardDescription>Employees with payroll calculation issues or missing data.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">Loading exceptions...</div>
                ) : payrollRecords.filter(r => r.hasExceptions).length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No exceptions found for this period.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Exception(s)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollRecords.filter(r => r.hasExceptions).map(record => (
                        <TableRow key={record.id}>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell>
                            <ul className="list-disc ml-4">
                              {record.exceptions?.map((ex, i) => <li key={i}>{ex}</li>)}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{record.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab - Visual Stats */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Summary</CardTitle>
                <CardDescription>Visual overview of payroll totals and statistics for the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground">Total Employees</div>
                    <div className="text-2xl font-bold">{payrollRecords.length}</div>
                    <Progress value={payrollRecords.length > 0 ? 100 : 0} className="h-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground">Gross Payroll</div>
                    <div className="text-2xl font-bold">{formatCurrencyCompact(payrollRecords.reduce((sum, r) => sum + (typeof r.grossSalary === 'number' ? r.grossSalary : 0), 0))}</div>
                    <Progress value={payrollRecords.length ? 100 : 0} color="green" className="h-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground">Total Statutory Deductions</div>
                    <div className="text-2xl font-bold">{
                      formatCurrencyCompact(
                        payrollRecords.reduce((sum, r) => {
                          // Prefer explicit statutoryDeductions fields
                          let paye = typeof r.statutoryDeductions?.paye === 'number' ? r.statutoryDeductions.paye : 0;
                          let nssf = typeof r.statutoryDeductions?.nssf === 'number' ? r.statutoryDeductions.nssf : 0;
                          let nhif = typeof r.statutoryDeductions?.nhif === 'number' ? r.statutoryDeductions.nhif : 0;
                          // Fallback: sum from payrollItems if needed
                          if ((!paye || !nssf || !nhif) && Array.isArray(r.payrollItems)) {
                            if (!paye) paye = r.payrollItems.filter((item) => item.isStatutory && (item.name === 'PAYE' || item.name === 'Income Tax (PAYE)')).reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0);
                            if (!nssf) nssf = r.payrollItems.filter((item) => item.isStatutory && item.name === 'NSSF').reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0);
                            if (!nhif) nhif = r.payrollItems.filter((item) => item.isStatutory && item.name === 'NHIF').reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0);
                          }
                          return sum + paye + nssf + nhif;
                        }, 0)
                      )
                    }</div>
                    <Progress value={payrollRecords.length ? 100 : 0} color="yellow" className="h-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground">Net Payroll</div>
                    <div className="text-2xl font-bold">{formatCurrencyCompact(payrollRecords.reduce((sum, r) => sum + (typeof r.netSalary === 'number' ? r.netSalary : 0), 0))}</div>
                    <Progress value={payrollRecords.length ? 100 : 0} color="blue" className="h-2" />
                  </div>
                </div>
                {/* Payroll Distribution Pie Chart */}
                <div className="mt-8 flex flex-col items-center">
                  {(() => {
                    // Calculate summary values for the chart
                    const gross = payrollRecords.reduce((sum, r) => sum + (typeof r.grossSalary === 'number' ? r.grossSalary : 0), 0);
                    const net = payrollRecords.reduce((sum, r) => sum + (typeof r.netSalary === 'number' ? r.netSalary : 0), 0);
                    const statutory = payrollRecords.reduce((sum, r) => {
                      let paye = typeof r.statutoryDeductions?.paye === 'number' ? r.statutoryDeductions.paye : 0;
                      let nssf = typeof r.statutoryDeductions?.nssf === 'number' ? r.statutoryDeductions.nssf : 0;
                      let nhif = typeof r.statutoryDeductions?.nhif === 'number' ? r.statutoryDeductions.nhif : 0;
                      if ((!paye || !nssf || !nhif) && Array.isArray(r.payrollItems)) {
                        if (!paye) paye = r.payrollItems.filter((item) => item.isStatutory && (item.name === 'PAYE' || item.name === 'Income Tax (PAYE)')).reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0);
                        if (!nssf) nssf = r.payrollItems.filter((item) => item.isStatutory && item.name === 'NSSF').reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0);
                        if (!nhif) nhif = r.payrollItems.filter((item) => item.isStatutory && item.name === 'NHIF').reduce((s, i) => s + (typeof i.amount === 'number' ? i.amount : 0), 0);
                      }
                      return sum + paye + nssf + nhif;
                    }, 0);
                    return <PayrollPieChart gross={gross} statutory={statutory} net={net} />;
                  })()}
                  <div className="mt-2 text-xs text-muted-foreground">Payroll Distribution</div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" disabled={loading || !currentPeriod}>Export Summary</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
  // ...existing code...
};

export default PayrollProcessing;
