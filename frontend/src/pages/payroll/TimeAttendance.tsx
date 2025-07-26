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
import { 
  Clock, 
  CheckCircle,
  XCircle,
  Edit,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payrollService } from '@/services/api/payroll.service';
import type { TimeEntry, KenyanPayrollEmployee as PayrollEmployee } from '@/types/payroll';

const TimeAttendance = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState<Partial<TimeEntry> | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load time entries and employees
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Try to get time entries from API
        const entries = await payrollService.getTimeEntries();
        const employeeData = await payrollService.getPayrollEmployees();
        setTimeEntries(entries);
        setFilteredEntries(entries);
        setEmployees(employeeData);
      } catch (error) {
        console.error('Failed to load time entries:', error);
        toast({
          title: "Error",
          description: "Failed to load time entry data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Filter time entries based on search term, employee, and status
  useEffect(() => {
    let filtered = timeEntries;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const employee = employees.find(emp => emp.employeeId === entry.employeeId);
        if (!employee) return false;
        return (
          employee.firstName.toLowerCase().includes(term) ||
          employee.lastName.toLowerCase().includes(term) ||
          `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(term)
        );
      });
    }
    
    if (employeeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.employeeId === employeeFilter);
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        filtered = filtered.filter(entry => entry.approved);
      } else {
        filtered = filtered.filter(entry => !entry.approved);
      }
    }
    
    setFilteredEntries(filtered);
  }, [searchTerm, employeeFilter, statusFilter, timeEntries, employees]);

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditedEntry({ ...entry });
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!editedEntry) return;
    
    try {
      // Call API to update time entry
      // await payrollService.updateTimeEntry(editedEntry.id || '', editedEntry);
      
      // Update local state
      setTimeEntries(prev => prev.map(entry => 
        entry.id === editedEntry.id ? { ...entry, ...editedEntry } : entry
      ));
      
      toast({
        title: "Success",
        description: "Time entry updated successfully."
      });
      
      setIsEditing(false);
      setSelectedEntry(null);
      setEditedEntry(null);
    } catch (error) {
      console.error('Failed to update time entry:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      // Call API to approve time entry
      // await payrollService.approveTimeEntries([entryId], 'current-user');
      
      // Update local state
      setTimeEntries(prev => prev.map(entry => 
        entry.id === entryId ? { 
          ...entry, 
          approved: true,
          approvedBy: 'Current User',
          approvedDate: new Date().toISOString()
        } : entry
      ));
      
      toast({
        title: "Success",
        description: "Time entry approved successfully."
      });
    } catch (error) {
      console.error('Failed to approve time entry:', error);
      toast({
        title: "Error",
        description: "Failed to approve time entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkApprove = async () => {
    const unapprovedEntries = filteredEntries.filter(entry => !entry.approved);
    if (unapprovedEntries.length === 0) {
      toast({
        title: "Info",
        description: "No unapproved entries to approve."
      });
      return;
    }
    
    try {
      // Call API to approve time entries
      // await payrollService.approveTimeEntries(unapprovedEntries.map(entry => entry.id), 'current-user');
      
      // Update local state
      setTimeEntries(prev => prev.map(entry => 
        !entry.approved ? { 
          ...entry, 
          approved: true,
          approvedBy: 'Current User',
          approvedDate: new Date().toISOString()
        } : entry
      ));
      
      toast({
        title: "Success",
        description: `${unapprovedEntries.length} time entries approved successfully.`
      });
    } catch (error) {
      console.error('Failed to approve time entries:', error);
      toast({
        title: "Error",
        description: "Failed to approve time entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Use employeeNumber for display
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
  };

  const getTotalHours = (entry: TimeEntry) => {
    return entry.regularHours + entry.overtimeHours + entry.sickHours + 
           entry.vacationHours + entry.holidayHours + entry.personalHours;
  };

  const handleImportTimeData = async () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      // Call API to import time data
      // const formData = new FormData();
      // formData.append('file', importFile);
      // await payrollService.importTimeData(formData);
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Import Successful",
        description: "Time data has been imported successfully."
      });
      
      setShowImportDialog(false);
      setImportFile(null);
      
      // Reload data
      // loadData();
    } catch (error) {
      console.error('Failed to import time data:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import time data. Please check the file format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Call API to export time data
      // const reportData = await payrollService.exportTimeReport({
      //   startDate: '2024-12-01',
      //   endDate: '2024-12-31',
      //   format: 'excel'
      // });
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create and download a CSV file for export
      const csvContent = [
        'Employee ID,Employee Name,Date,Regular Hours,Overtime Hours,Sick Hours,Vacation Hours,Holiday Hours,Personal Hours,Total Hours,Status',
        ...filteredEntries.map(entry => {
          const employeeName = getEmployeeName(entry.employeeId);
          return [
            entry.employeeId,
            employeeName,
            entry.date,
            entry.regularHours,
            entry.overtimeHours,
            entry.sickHours,
            entry.vacationHours,
            entry.holidayHours,
            entry.personalHours,
            getTotalHours(entry),
            entry.approved ? 'Approved' : 'Pending'
          ].join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Time attendance report has been downloaded."
      });
    } catch (error) {
      console.error('Failed to export report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file.",
          variant: "destructive"
        });
        return;
      }
      
      setImportFile(file);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Time & Attendance">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading time entry data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Time & Attendance">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time & Attendance Management</CardTitle>
                <CardDescription>
                  Review and approve employee time entries for payroll processing
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Time Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Time Data</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="import-file">Select File</Label>
                        <Input
                          id="import-file"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                        />
                        <p className="text-sm text-muted-foreground">
                          Supported formats: CSV, Excel (.xlsx, .xls)
                        </p>
                      </div>
                      
                      {importFile && (
                        <div className="space-y-2">
                          <Label>Selected File</Label>
                          <div className="p-2 border rounded-md bg-muted">
                            <p className="text-sm font-medium">{importFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Size: {(importFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          The file should contain columns: Employee ID, Date, Regular Hours, Overtime Hours, Sick Hours, Vacation Hours, Holiday Hours, Personal Hours
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleImportTimeData} disabled={!importFile || isImporting}>
                          {isImporting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Import Data
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName + ' ' + emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="entries">Time Entries</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-6">
            {/* Time Entries Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Employee Time Entries</CardTitle>
                  <Button onClick={handleBulkApprove}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Regular Hours</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>PTO</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="font-medium">{getEmployeeName(entry.employeeId)}</div>
                            <div className="text-sm text-muted-foreground">{entry.employeeId}</div>
                          </TableCell>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{entry.regularHours}h</TableCell>
                          <TableCell>
                            {entry.overtimeHours > 0 ? (
                              <span className="text-orange-600">{entry.overtimeHours}h</span>
                            ) : (
                              '0h'
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.sickHours + entry.vacationHours + entry.personalHours + entry.holidayHours}h
                          </TableCell>
                          <TableCell className="font-medium">{getTotalHours(entry)}h</TableCell>
                          <TableCell>
                            {entry.approved ? (
                              <Badge className="bg-green-100 text-green-800">Approved</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditEntry(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              {!entry.approved && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleApproveEntry(entry.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No time entries found matching the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{timeEntries.length}</div>
                  <p className="text-xs text-muted-foreground">For current period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{timeEntries.filter(entry => !entry.approved).length}</div>
                  <p className="text-xs text-muted-foreground">Require manager review</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {timeEntries.reduce((sum, entry) => sum + getTotalHours(entry), 0)}h
                  </div>
                  <p className="text-xs text-muted-foreground">All employees</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {timeEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0)}h
                  </div>
                  <p className="text-xs text-muted-foreground">All employees</p>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                All time entries must be approved before payroll processing. Ensure overtime is properly documented and approved.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TimeAttendance;
