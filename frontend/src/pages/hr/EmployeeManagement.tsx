import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Shield, Info, AlertTriangle, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User, Branch, Department } from '@/types/types';
import { canAddEmployee, canDeleteEmployee, canEditEmployeeDetails, getRolePermissionsDescription, getRoleDisplayName, canPerformActionOnEmployee } from '@/utils/permissions';
import { employeeService, Employee } from '@/services/api/employee.service';
import { branchService } from '@/services/api/branch.service';
import { departmentService } from '@/services/api/department.service';

const EmployeeManagement = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);


  // Helper to get department/branch name by id
  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || '';
  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || '';

  // No longer map department and branch to objects; keep API string values
  const mergeEmployeeData = (employees: User[]) => employees;

  // Permission checks
  const canAdd = canAddEmployee(currentUser);
  const canEdit = canEditEmployeeDetails(currentUser);
  const canDelete = canDeleteEmployee(currentUser);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, branchesResponse, departmentsResponse] = await Promise.all([
          employeeService.getEmployees(),
          branchService.getAllBranches(),
          departmentService.getAllDepartments()
        ]);

        // Debug: log raw API responses
        console.log('Raw employeesResponse:', employeesResponse);
        console.log('Raw branchesResponse:', branchesResponse);
        console.log('Raw departmentsResponse:', departmentsResponse);

        let employeesAsUsers: User[] = [];
        if (employeesResponse.status === 'success' && employeesResponse.data) {
          employeesAsUsers = employeesResponse.data.map((emp: any) => ({
            id: emp.id,
            employeeId: emp.employeeNumber || emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            role: 'EMPLOYEE',
            branchId: emp.branchId || '',
            departmentId: emp.departmentId || '',
            position: emp.position,
            hireDate: emp.hireDate,
            phone: emp.phone || '',
            status: emp.status === 'terminated' ? 'inactive' : (emp.status || 'active')
          }));
          // Debug: log mapped employeesAsUsers
          console.log('Mapped employeesAsUsers:', employeesAsUsers);
        }
        setBranches(branchesResponse || []);
        setDepartments(departmentsResponse || []);
        // Only set employees after branches and departments are set
        const mergedEmployees = mergeEmployeeData(employeesAsUsers);
        // Debug: log mapped employees with relations
        console.log('Mapped employees with relations:', mergedEmployees);
        setEmployees(mergedEmployees);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast({
          title: "Error",
          description: "Failed to load employee data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [toast]);

  // Employee form state
  const [newEmployee, setNewEmployee] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    branchId: '',
    departmentId: '',
    position: '',
    hireDate: '',
    phone: ''
  });

  // On initial load or when employees/branches/departments change, map department and branch objects for all employees
  // Remove this useEffect to avoid double mapping and stale data
  // Mapping is done after fetch and after create/update

  // Filter employees
  const filteredEmployees = employees.filter(employee =>
    employee &&
    (employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Import functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setImportFile(file);
      setImportResults(null);
    }
  };

  const handleImportEmployees = async () => {
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
      const results = await employeeService.importEmployees(importFile);
      setImportResults(results);
      
      if (results.success > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${results.success} employees. ${results.failed} failed.`,
        });

        // Refresh the employee list
        const employeesResponse = await employeeService.getEmployees();
        if (employeesResponse.status === 'success' && employeesResponse.data) {
          // Always map relations after fetch
          const employeesAsUsers: User[] = employeesResponse.data.map((emp: any) => ({
            id: emp.id,
            employeeId: emp.employeeNumber || emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            role: 'EMPLOYEE',
            branchId: emp.branchId || '',
            departmentId: emp.departmentId || '',
            position: emp.position,
            hireDate: emp.hireDate,
            phone: emp.phone || '',
            status: emp.status === 'terminated' ? 'inactive' : (emp.status || 'active')
          }));
          setEmployees(mergeEmployeeData(employeesAsUsers));
        }
      } else {
        toast({
          title: "Import Failed",
          description: "No employees were imported. Please check the file format and data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to import employees:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import employees. Please check the file format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      'employeeId,firstName,lastName,email,phone,position,department,branch,hireDate',
      '# Example:',
      'EMP001,John,Doe,john.doe@company.com,+254712345678,Software Developer,IT,Head Office,2024-01-15',
      '# Required fields: employeeId, firstName, lastName, email',
      '# Optional fields: phone, position, department, branch, hireDate',
      '# Date format: YYYY-MM-DD',
      '# Department and Branch should match existing ones in the system'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Employee import template has been downloaded."
    });
  };

  // Form validation
  const validateForm = (employeeData: typeof newEmployee): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!employeeData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!employeeData.firstName.trim()) errors.firstName = 'First name is required';
    if (!employeeData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!employeeData.email.trim()) errors.email = 'Email is required';
    if (!employeeData.branchId) errors.branchId = 'Branch is required';
    if (!employeeData.departmentId) errors.departmentId = 'Department is required';
    if (!employeeData.position.trim()) errors.position = 'Position is required';
    if (!employeeData.hireDate) errors.hireDate = 'Hire date is required';
    
    // Email validation
    if (employeeData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Check for duplicate employee ID
    if (employeeData.employeeId && employees.some(emp => emp.employeeId === employeeData.employeeId)) {
      errors.employeeId = 'Employee ID already exists';
    }
    
    // Check for duplicate email
    if (employeeData.email && employees.some(emp => emp.email === employeeData.email)) {
      errors.email = 'Email already exists';
    }
    
    return errors;
  };

  // CRUD Operations
  const handleCreateEmployee = async () => {
    const errors = validateForm(newEmployee);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      const employeeRequest: any = {
        employeeId: newEmployee.employeeId,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        phone: newEmployee.phone,
        position: newEmployee.position,
        department: newEmployee.departmentId,
        branch: newEmployee.branchId,
        hireDate: newEmployee.hireDate,
      };

      const response = await employeeService.createEmployee(employeeRequest);
      
      // Add to local state
      const newUser: User = {
        id: response.id,
        employeeId: response.employeeId,
        firstName: response.firstName,
        lastName: response.lastName,
        email: response.email,
        role: 'EMPLOYEE',
        branchId: newEmployee.branchId,
        departmentId: newEmployee.departmentId,
        position: response.position,
        hireDate: response.hireDate,
        phone: response.phone || '',
        status: response.status === 'terminated' ? 'inactive' : (response.status || 'active')
      };
      // Always map relations after adding
      setEmployees(prev => mergeEmployeeData([...prev, newUser]));
      setNewEmployee({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        branchId: '',
        departmentId: '',
        position: '',
        hireDate: '',
        phone: ''
      });
      setIsAddDialogOpen(false);
      setFormErrors({});
      
      toast({
        title: "Employee Created",
        description: `${response.firstName} ${response.lastName} has been added successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee.",
        variant: "destructive",
      });
    }
  };

  const handleEditEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    setNewEmployee({
      employeeId: employee.employeeId || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      branchId: employee.branchId || '',
      departmentId: employee.departmentId || '',
      position: employee.position || '',
      hireDate: employee.hireDate || '',
      phone: employee.phone || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    const errors = validateForm(newEmployee);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      const updateRequest: any = {
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        phone: newEmployee.phone,
        position: newEmployee.position,
        departmentId: newEmployee.departmentId, // send as ID
        branchId: newEmployee.branchId, // send as ID
        hireDate: newEmployee.hireDate,
      };

      const response = await employeeService.updateEmployee(selectedEmployee.id, updateRequest);

      // Update local state
      // Always map relations after update
      setEmployees(prev => {
        const updated = prev.map(emp => 
          emp.id === selectedEmployee.id 
            ? {
                ...emp,
                firstName: response.firstName,
                lastName: response.lastName,
                email: response.email,
                phone: response.phone || '',
                position: response.position,
                branchId: newEmployee.branchId,
                departmentId: newEmployee.departmentId,
                hireDate: response.hireDate,
              }
            : emp
        );
        return mergeEmployeeData(updated);
      });

      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      setFormErrors({});

      toast({
        title: "Employee Updated",
        description: `${response.firstName} ${response.lastName} has been updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (employee: User) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await employeeService.deleteEmployee(employee.id);
      
      setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      
      toast({
        title: "Employee Deleted",
        description: `${employee.firstName} ${employee.lastName} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Employee Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={downloadTemplate}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <Download className="h-4 w-4 text-white" />
              <span>Download Template</span>
            </Button>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-white" />
                  <span>Import Employees</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Employees</DialogTitle>
                  <DialogDescription>
                    Upload a CSV or Excel file to import multiple employees at once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-file">Select File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      disabled={isImporting}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: CSV, Excel (.xlsx, .xls). Max file size: 10MB.
                    </p>
                  </div>
                  
                  {importFile && (
                    <div className="space-y-2">
                      <Label>Selected File</Label>
                      <div className="p-3 border rounded-md bg-muted">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{importFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Size: {(importFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}

                  {importResults && (
                    <div className="space-y-2">
                      <Label>Import Results</Label>
                      <div className="p-3 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Summary:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span>Successful:</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {importResults.success}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Failed:</span>
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              {importResults.failed}
                            </Badge>
                          </div>
                        </div>
                        
                        {importResults.errors.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Errors:</p>
                            <div className="max-h-32 overflow-y-auto">
                              {importResults.errors.slice(0, 5).map((error, index) => (
                                <Alert key={index} className="mb-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Row {error.row}: {error.error}
                                  </AlertDescription>
                                </Alert>
                              ))}
                              {importResults.errors.length > 5 && (
                                <p className="text-xs text-muted-foreground">
                                  ... and {importResults.errors.length - 5} more errors
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Required columns:</strong> employeeId, firstName, lastName, email<br />
                      <strong>Optional columns:</strong> phone, position, department, branch, hireDate<br />
                      Download the template file to see the expected format.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setImportFile(null);
                        setImportResults(null);
                      }}
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleImportEmployees} 
                      disabled={!importFile || isImporting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isImporting ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Employees
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Add Employee</span>
            </Button>
          </div>
        </div>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
            <CardDescription>
              Manage employee information and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading employees...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{employee.firstName} {employee.lastName}</div>
                          <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{getDepartmentName(employee.departmentId)}</TableCell>
                      <TableCell>{getBranchName(employee.branchId)}</TableCell>
                      <TableCell>{employee.position || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {canEdit && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hover:bg-blue-100"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hover:bg-red-100"
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Employee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
              <DialogDescription>
                Create a new employee record in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    placeholder="Enter employee ID"
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    className={formErrors.employeeId ? 'border-red-500' : ''}
                  />
                  {formErrors.employeeId && <p className="text-sm text-red-500">{formErrors.employeeId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className={formErrors.firstName ? 'border-red-500' : ''}
                  />
                  {formErrors.firstName && <p className="text-sm text-red-500">{formErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className={formErrors.lastName ? 'border-red-500' : ''}
                  />
                  {formErrors.lastName && <p className="text-sm text-red-500">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={newEmployee.departmentId}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, departmentId: value })}
                  >
                    <SelectTrigger className={formErrors.departmentId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.departmentId && <p className="text-sm text-red-500">{formErrors.departmentId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Select
                    value={newEmployee.branchId}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, branchId: value })}
                  >
                    <SelectTrigger className={formErrors.branchId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.branchId && <p className="text-sm text-red-500">{formErrors.branchId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    placeholder="Enter position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className={formErrors.position ? 'border-red-500' : ''}
                  />
                  {formErrors.position && <p className="text-sm text-red-500">{formErrors.position}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={newEmployee.hireDate ? newEmployee.hireDate.split('T')[0] : ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                    className={formErrors.hireDate ? 'border-red-500' : ''}
                  />
                  {formErrors.hireDate && <p className="text-sm text-red-500">{formErrors.hireDate}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-employeeId">Employee ID *</Label>
                  <Input
                    id="edit-employeeId"
                    placeholder="Enter employee ID"
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    className={formErrors.employeeId ? 'border-red-500' : ''}
                    disabled
                  />
                  {formErrors.employeeId && <p className="text-sm text-red-500">{formErrors.employeeId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    placeholder="Enter phone number"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Enter first name"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className={formErrors.firstName ? 'border-red-500' : ''}
                  />
                  {formErrors.firstName && <p className="text-sm text-red-500">{formErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Enter last name"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className={formErrors.lastName ? 'border-red-500' : ''}
                  />
                  {formErrors.lastName && <p className="text-sm text-red-500">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Enter email address"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department *</Label>
                  <Select
                    value={newEmployee.departmentId}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, departmentId: value })}
                  >
                    <SelectTrigger className={formErrors.departmentId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.departmentId && <p className="text-sm text-red-500">{formErrors.departmentId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-branch">Branch *</Label>
                  <Select
                    value={newEmployee.branchId}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, branchId: value })}
                  >
                    <SelectTrigger className={formErrors.branchId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.branchId && <p className="text-sm text-red-500">{formErrors.branchId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position *</Label>
                  <Input
                    id="edit-position"
                    placeholder="Enter position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className={formErrors.position ? 'border-red-500' : ''}
                  />
                  {formErrors.position && <p className="text-sm text-red-500">{formErrors.position}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hireDate">Hire Date *</Label>
                  <Input
                    id="edit-hireDate"
                    type="date"
                    value={newEmployee.hireDate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                    className={formErrors.hireDate ? 'border-red-500' : ''}
                  />
                  {formErrors.hireDate && <p className="text-sm text-red-500">{formErrors.hireDate}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Employee
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeManagement;
