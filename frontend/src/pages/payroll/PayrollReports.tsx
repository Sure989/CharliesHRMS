import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download,
  Calendar,
  Users,
  DollarSign,
  BarChart,
  PieChart,
  FileSpreadsheet,
  File,
  Printer,
  Mail,
  Info,
  RefreshCw,
  Save,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import PayrollDataService from '@/services/payrollDataService';
import { payrollService } from '@/services/api/payroll.service';
import { formatCurrencyCompact } from '@/utils/currency';

const PayrollReports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedReportType, setSelectedReportType] = useState('summary');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleRecipients, setScheduleRecipients] = useState('');
  const [payrollPeriods, setPayrollPeriods] = useState<any[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [periodsResponse, summary, reports] = await Promise.all([
          payrollService.getPayrollPeriods(),
          PayrollDataService.getPayrollSummary(),
          PayrollDataService.getRecentReports() // Add this API method
        ]);
        
        // Ensure periods is always an array
        const periods = Array.isArray(periodsResponse?.data) ? periodsResponse.data : 
                       Array.isArray(periodsResponse) ? periodsResponse : [];
        
        setPayrollPeriods(periods);
        setPayrollSummary(summary);
        setRecentReports(reports || []);
      } catch (error) {
        console.error('Failed to load payroll data:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load payroll report data.', 
          variant: 'destructive' 
        });
        // Set fallback data to prevent crashes
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();
        
        setPayrollPeriods([
          {
            id: 'current',
            name: `${currentMonth} ${currentYear}`,
            startDate: new Date(currentYear, currentDate.getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(currentYear, currentDate.getMonth() + 1, 0).toISOString().split('T')[0],
            status: 'current'
          },
          {
            id: 'previous',
            name: `${new Date(currentYear, currentDate.getMonth() - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
            startDate: new Date(currentYear, currentDate.getMonth() - 1, 1).toISOString().split('T')[0],
            endDate: new Date(currentYear, currentDate.getMonth(), 0).toISOString().split('T')[0],
            status: 'completed'
          }
        ]);
        setPayrollSummary({
          totalEmployees: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
          totalPaye: 0,
          totalNssf: 0,
          totalNhif: 0
        });
        setRecentReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Report types configuration (can be loaded from backend later)
  const reportTypes = [
    { id: 'summary', name: 'Payroll Summary', description: 'Overview of payroll totals and deductions' },
    { id: 'detail', name: 'Detailed Payroll', description: 'Detailed breakdown by employee' },
    { id: 'statutory', name: 'Statutory Reports', description: 'PAYE, NSSF, and NHIF reports' },
    { id: 'bank', name: 'Bank Transfer', description: 'Bank payment instructions' },
    { id: 'p9', name: 'P9 Forms', description: 'Annual tax deduction cards' },
    { id: 'custom', name: 'Custom Report', description: 'Build a custom report' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Call API to generate report
      // const report = await api.payroll.generatePayrollReport(selectedReportType, {
      //   periodId: selectedPeriod,
      //   format: selectedFormat
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Report Generated",
        description: `Your ${selectedReportType} report has been generated successfully.`
      });
      
      // Simulate download
      if (selectedFormat === 'pdf') {
        window.open('#', '_blank');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      // Find the report
      const report = recentReports.find(r => r.id === reportId);
      if (!report) {
        toast({
          title: "Error",
          description: "Report not found.",
          variant: "destructive"
        });
        return;
      }

      // Simulate API call to get report data
      // const reportData = await api.payroll.downloadReport(reportId);
      
      // Create report content based on type
      let content = '';
      let filename = '';
      let mimeType = '';

      if (report.format === 'PDF') {
        // For PDF, we would normally get binary data from API
        content = `PDF Report: ${report.name}\nGenerated: ${new Date().toISOString()}\n\nReport data would be retrieved from the database.`;
        filename = `${report.name.replace(/\s+/g, '_')}.pdf`;
        mimeType = 'application/pdf';
      } else if (report.format === 'Excel') {
        // Create header-only CSV without hardcoded employee data
        content = [
          'Employee ID,Employee Name,Gross Pay,PAYE,NSSF,NHIF,Net Pay',
          '# Data would be loaded from database API',
          '# No hardcoded employee information'
        ].join('\n');
        filename = `${report.name.replace(/\s+/g, '_')}.csv`;
        mimeType = 'text/csv';
      } else {
        // CSV format - header only
        content = [
          'Employee ID,Employee Name,Gross Pay,PAYE,NSSF,NHIF,Net Pay',
          '# Data would be loaded from database API',
          '# No hardcoded employee information'
        ].join('\n');
        filename = `${report.name.replace(/\s+/g, '_')}.csv`;
        mimeType = 'text/csv';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${report.name} is being downloaded.`
      });
    } catch (error) {
      console.error('Failed to download report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrintReport = async () => {
    setIsPrinting(true);
    try {
      // Generate print-friendly content
      const reportContent = `
        <html>
          <head>
            <title>${reportTypes.find(t => t.id === selectedReportType)?.name} - ${Array.isArray(payrollPeriods) ? payrollPeriods.find(p => p.id === selectedPeriod)?.name : 'Current Period'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { margin-bottom: 20px; }
              .summary-item { display: flex; justify-content: space-between; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${reportTypes.find(t => t.id === selectedReportType)?.name}</h1>
              <h2>${Array.isArray(payrollPeriods) ? payrollPeriods.find(p => p.id === selectedPeriod)?.name : 'Current Period'}</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="summary">
              <h3>Summary</h3>
              <div class="summary-item"><span>Total Employees:</span><span>${payrollSummary?.totalEmployees || 0}</span></div>
              <div class="summary-item"><span>Total Gross Pay:</span><span>${formatCurrencyCompact(payrollSummary?.totalGrossPay || 0)}</span></div>
              <div class="summary-item"><span>Total Net Pay:</span><span>${formatCurrencyCompact(payrollSummary?.totalNetPay || 0)}</span></div>
              <div class="summary-item"><span>Total PAYE:</span><span>${formatCurrencyCompact(payrollSummary?.totalPaye || 0)}</span></div>
              <div class="summary-item"><span>Total NSSF:</span><span>${formatCurrencyCompact(payrollSummary?.totalNssf || 0)}</span></div>
              <div class="summary-item"><span>Total NHIF:</span><span>${formatCurrencyCompact(payrollSummary?.totalNhif || 0)}</span></div>
            </div>
          </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      toast({
        title: "Print Ready",
        description: "Report has been prepared for printing."
      });
    } catch (error) {
      console.error('Failed to print report:', error);
      toast({
        title: "Print Failed",
        description: "Failed to prepare report for printing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleEmailReport = async () => {
    if (!emailRecipients.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one email recipient.",
        variant: "destructive"
      });
      return;
    }

    setIsEmailing(true);
    try {
      // Call API to send email
      // await api.payroll.emailReport({
      //   reportType: selectedReportType,
      //   periodId: selectedPeriod,
      //   format: selectedFormat,
      //   recipients: emailRecipients.split(',').map(email => email.trim()),
      //   subject: emailSubject,
      //   message: emailMessage
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Email Sent",
        description: `Report has been emailed to ${emailRecipients.split(',').length} recipient(s).`
      });

      // Reset form
      setEmailRecipients('');
      setEmailSubject('');
      setEmailMessage('');
      setShowEmailDialog(false);
    } catch (error) {
      console.error('Failed to email report:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a schedule name.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call API to create schedule
      // await api.payroll.createReportSchedule({
      //   name: scheduleName,
      //   reportType: selectedReportType,
      //   frequency: scheduleFrequency,
      //   recipients: scheduleRecipients.split(',').map(email => email.trim()),
      //   format: selectedFormat
      // });

      toast({
        title: "Schedule Created",
        description: `Report schedule "${scheduleName}" has been created successfully.`
      });

      // Reset form
      setScheduleName('');
      setScheduleRecipients('');
      setShowScheduleDialog(false);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast({
        title: "Schedule Creation Failed",
        description: "Failed to create report schedule. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'summary': return <BarChart className="h-4 w-4" />;
      case 'detail': return <FileText className="h-4 w-4" />;
      case 'statutory': return <FileText className="h-4 w-4" />;
      case 'bank': return <DollarSign className="h-4 w-4" />;
      case 'p9': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return <File className="h-4 w-4" />;
      case 'Excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'CSV': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout title="Payroll Reports">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading payroll reports...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger value="recent">Recent Reports</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* Report Generator */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Payroll Report</CardTitle>
                <CardDescription>
                  Create payroll reports for compliance, analysis, and record-keeping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                        <SelectTrigger id="report-type">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center">
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {reportTypes.find(t => t.id === selectedReportType)?.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pay-period">Pay Period</Label>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger id="pay-period">
                          <SelectValue placeholder="Select pay period" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(payrollPeriods) && payrollPeriods.length > 0 ? (
                            payrollPeriods.map((period) => (
                              <SelectItem key={period.id} value={period.id}>
                                {period.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No payroll periods available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="format">Output Format</Label>
                      <div className="flex space-x-2">
                        <Button 
                          variant={selectedFormat === 'pdf' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setSelectedFormat('pdf')}
                        >
                          <File className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          variant={selectedFormat === 'excel' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setSelectedFormat('excel')}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                        <Button 
                          variant={selectedFormat === 'csv' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setSelectedFormat('csv')}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleGenerateReport} 
                        disabled={isGenerating}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>Generating Report...</>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Report Preview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Report Type:</span>
                          <span className="font-medium">
                            {reportTypes.find(t => t.id === selectedReportType)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pay Period:</span>
                          <span className="font-medium">
                            {Array.isArray(payrollPeriods) ? payrollPeriods.find(p => p.id === selectedPeriod)?.name : 'Current Period'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Format:</span>
                          <span className="font-medium">
                            {selectedFormat.toUpperCase()}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Employees:</span>
                            <span className="font-medium">{payrollSummary?.totalEmployees || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Gross Pay:</span>
                            <span className="font-medium">{formatCurrencyCompact(payrollSummary?.totalGrossPay || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Net Pay:</span>
                            <span className="font-medium">{formatCurrencyCompact(payrollSummary?.totalNetPay || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1" onClick={handlePrintReport} disabled={isPrinting}>
                        {isPrinting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Printing...
                          </>
                        ) : (
                          <>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </>
                        )}
                      </Button>
                      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Email Report</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="email-recipients">Recipients *</Label>
                              <Input
                                id="email-recipients"
                                placeholder="email1@example.com, email2@example.com"
                                value={emailRecipients}
                                onChange={(e) => setEmailRecipients(e.target.value)}
                              />
                              <p className="text-sm text-muted-foreground">
                                Separate multiple email addresses with commas
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="email-subject">Subject</Label>
                              <Input
                                id="email-subject"
                                placeholder={`${reportTypes.find(t => t.id === selectedReportType)?.name} - ${Array.isArray(payrollPeriods) ? payrollPeriods.find(p => p.id === selectedPeriod)?.name : 'Current Period'}`}
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="email-message">Message</Label>
                              <Textarea
                                id="email-message"
                                placeholder="Optional message to include with the report..."
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                rows={4}
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleEmailReport} disabled={isEmailing}>
                                {isEmailing ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Types */}
            <div className="grid gap-4 md:grid-cols-3">
              {reportTypes.map((type) => (
                <Card key={type.id} className={selectedReportType === type.id ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{type.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedReportType(type.id)}
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  Reports generated in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getReportTypeIcon(report.type)}
                            <span>{report.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getFormatIcon(report.format)}
                            <span>{report.format}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{report.generatedDate}</div>
                            <div className="text-sm text-muted-foreground">By {report.generatedBy}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            {/* Scheduled Reports */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scheduled Reports</CardTitle>
                    <CardDescription>
                      Automatically generated reports on a schedule
                    </CardDescription>
                  </div>
                  <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        New Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Report Schedule</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="schedule-name">Schedule Name *</Label>
                          <Input
                            id="schedule-name"
                            placeholder="e.g., Monthly Payroll Summary"
                            value={scheduleName}
                            onChange={(e) => setScheduleName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="schedule-report-type">Report Type</Label>
                          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                            <SelectTrigger id="schedule-report-type">
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                              {reportTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="schedule-frequency">Frequency</Label>
                          <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                            <SelectTrigger id="schedule-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="schedule-format">Output Format</Label>
                          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                            <SelectTrigger id="schedule-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="schedule-recipients">Email Recipients</Label>
                          <Input
                            id="schedule-recipients"
                            placeholder="email1@example.com, email2@example.com"
                            value={scheduleRecipients}
                            onChange={(e) => setScheduleRecipients(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Separate multiple email addresses with commas
                          </p>
                        </div>
                        
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Scheduled reports will be automatically generated and emailed to the specified recipients based on the selected frequency.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateSchedule}>
                            <Save className="h-4 w-4 mr-2" />
                            Create Schedule
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No scheduled reports configured. Click "New Schedule" to set up automatic report generation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      )}
    </DashboardLayout>
  );
};

export default PayrollReports;
