import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  DollarSign, 
  Edit,
  Save,
  RefreshCw,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeeService, type Employee } from '@/services/api/employee.service';
import PayrollDataService from '@/services/payrollDataService';
import { PayrollEngine } from '@/services/payrollEngine';
import type { KenyanPayrollEmployee } from '@/types/payroll';

// Enhanced employee type with Kenyan payroll information
interface KenyanEmployee extends Employee {
  payrollInfo: {
    employeeType: 'hourly' | 'salaried';
    monthlySalary?: number;
    hourlyRate?: number;
    overtimeRate?: number;
    personalRelief: number;
    kraPin?: string;
    nssfNumber?: string;
    nhifNumber?: string;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      branchCode: string;
    };
  };
}

const EmployeeCompensation = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<KenyanEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<KenyanEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<KenyanEmployee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<KenyanEmployee>>({});

  // Load employees with Kenyan payroll data
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Get employees from database
      const employeeResponse = await employeeService.getEmployees();
      
      if (employeeResponse?.data?.length > 0) {
        // Get payroll data
        let payrollData: KenyanPayrollEmployee[] = [];
        try {
          payrollData = await PayrollDataService.getAllPayrollEmployees();
        } catch (error) {
          console.log('No payroll data available:', error);
        }
        
        // Merge employee and payroll data with Kenyan defaults
        const kenyanEmployees: KenyanEmployee[] = employeeResponse.data.map(employee => {
          const payrollEmployee = payrollData.find(pe => pe.employeeId === employee.employeeId);
          
          return {
            ...employee,
            payrollInfo: {
              employeeType: payrollEmployee?.payrollInfo?.employeeType || 'salaried',
              monthlySalary: payrollEmployee?.payrollInfo?.monthlySalary || employee.salary || 0,
              hourlyRate: payrollEmployee?.payrollInfo?.hourlyRate || 0,
              overtimeRate: payrollEmployee?.payrollInfo?.overtimeRate || 0,
              personalRelief: payrollEmployee?.payrollInfo?.personalRelief || 2400, // Kenyan personal relief
              kraPin: employee.taxInfo?.kraPin || '',
              nssfNumber: employee.taxInfo?.nssfNumber || '',
              nhifNumber: employee.taxInfo?.nhifNumber || '',
              bankAccount: {
                bankName: employee.bankDetails?.bankName || '',
                accountNumber: employee.bankDetails?.accountNumber || '',
                branchCode: employee.bankDetails?.branchCode || ''
              }
            }
          };
        });
        
        setEmployees(kenyanEmployees);
        setFilteredEmployees(kenyanEmployees);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
        toast({
          title: "No Employees Found",
          description: "No employees found in the database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employee data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter employees
  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter]);

  // Get unique departments
  const departments = ['all', ...new Set(employees.map(emp => emp.department).filter(Boolean))];

  // Calculate Kenyan net pay
  const calculateNetPay = (employee: KenyanEmployee): number => {
    const grossPay = employee.payrollInfo.employeeType === 'salaried' 
      ? employee.payrollInfo.monthlySalary || 0
      : (employee.payrollInfo.hourlyRate || 0) * 160; // Assume 160 hours/month

    const paye = PayrollEngine.calculatePAYE(grossPay, employee.payrollInfo.personalRelief);
    const nssf = PayrollEngine.calculateNSSF(grossPay);
    const nhif = PayrollEngine.calculateNHIF(grossPay);
    
    return grossPay - paye - nssf - nhif;
  };

  // Get gross pay
  const getGrossPay = (employee: KenyanEmployee): number => {
    return employee.payrollInfo.employeeType === 'salaried' 
      ? employee.payrollInfo.monthlySalary || 0
      : (employee.payrollInfo.hourlyRate || 0) * 160;
  };

  // Handle edit employee
  const handleEdit = (employee: KenyanEmployee) => {
    setSelectedEmployee(employee);
    setEditData(employee);
    setIsEditing(true);
  };

  // Save employee changes
  const handleSave = async () => {
    if (!selectedEmployee || !editData) return;

    try {
      // Update employee basic info
      await employeeService.updateEmployee(selectedEmployee.id, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        department: editData.department,
        position: editData.position,
        salary: editData.payrollInfo?.monthlySalary,
        taxInfo: {
          kraPin: editData.payrollInfo?.kraPin,
          nssfNumber: editData.payrollInfo?.nssfNumber,
          nhifNumber: editData.payrollInfo?.nhifNumber
        },
        bankDetails: editData.payrollInfo?.bankAccount ? {
          bankName: editData.payrollInfo.bankAccount.bankName,
          accountNumber: editData.payrollInfo.bankAccount.accountNumber,
          branchCode: editData.payrollInfo.bankAccount.branchCode,
          accountType: 'savings'
        } : undefined
      });

      toast({
        title: "Success",
        description: "Employee updated successfully"
      });

      setIsEditing(false);
      setSelectedEmployee(null);
      setEditData({});
      await loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Employee Compensation">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading employees...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employee Compensation">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Employee Compensation</h1>
            <p className="text-muted-foreground">Manage employee compensation and Kenyan payroll settings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {employees.reduce((sum, emp) => sum + getGrossPay(emp), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Net Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {employees.length > 0 
                  ? Math.round(employees.reduce((sum, emp) => sum + calculateNetPay(emp), 0) / employees.length).toLocaleString()
                  : '0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Compensation Management</CardTitle>
            <CardDescription>View and manage employee compensation with Kenyan payroll calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Table */}
            {filteredEmployees.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No employees found. {searchTerm || departmentFilter !== 'all' ? 'Try adjusting your filters.' : 'Add employees to get started.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <Badge variant={employee.payrollInfo.employeeType === 'salaried' ? 'default' : 'secondary'}>
                            {employee.payrollInfo.employeeType === 'salaried' ? 'Salaried' : 'Hourly'}
                          </Badge>
                        </TableCell>
                        <TableCell>KES {getGrossPay(employee).toLocaleString()}</TableCell>
                        <TableCell>KES {calculateNetPay(employee).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditing} onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setSelectedEmployee(null);
            setEditData({});
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee Compensation</DialogTitle>
            </DialogHeader>
            
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={editData.firstName || ''}
                        onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={editData.lastName || ''}
                        onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Input
                        value={editData.department || ''}
                        onChange={(e) => setEditData({...editData, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Input
                        value={editData.position || ''}
                        onChange={(e) => setEditData({...editData, position: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Payroll Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kenyan Payroll Information</h3>
                  
                  <div>
                    <Label>Employee Type</Label>
                    <Select
                      value={editData.payrollInfo?.employeeType || 'salaried'}
                      onValueChange={(value: 'salaried' | 'hourly') => setEditData({
                        ...editData,
                        payrollInfo: { ...editData.payrollInfo, employeeType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salaried">Salaried</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editData.payrollInfo?.employeeType === 'salaried' ? (
                    <div>
                      <Label>Monthly Salary (KES)</Label>
                      <Input
                        type="number"
                        value={editData.payrollInfo?.monthlySalary || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { ...editData.payrollInfo, monthlySalary: Number(e.target.value) }
                        })}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>Hourly Rate (KES)</Label>
                      <Input
                        type="number"
                        value={editData.payrollInfo?.hourlyRate || 0}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { ...editData.payrollInfo, hourlyRate: Number(e.target.value) }
                        })}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Personal Relief (KES)</Label>
                    <Input
                      type="number"
                      value={editData.payrollInfo?.personalRelief || 2400}
                      onChange={(e) => setEditData({
                        ...editData,
                        payrollInfo: { ...editData.payrollInfo, personalRelief: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                {/* Kenyan Tax Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kenyan Tax Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>KRA PIN</Label>
                      <Input
                        value={editData.payrollInfo?.kraPin || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { ...editData.payrollInfo, kraPin: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>NSSF Number</Label>
                      <Input
                        value={editData.payrollInfo?.nssfNumber || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { ...editData.payrollInfo, nssfNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>NHIF Number</Label>
                      <Input
                        value={editData.payrollInfo?.nhifNumber || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { ...editData.payrollInfo, nhifNumber: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bank Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={editData.payrollInfo?.bankAccount?.bankName || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { 
                            ...editData.payrollInfo, 
                            bankAccount: { 
                              ...editData.payrollInfo?.bankAccount, 
                              bankName: e.target.value 
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={editData.payrollInfo?.bankAccount?.accountNumber || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { 
                            ...editData.payrollInfo, 
                            bankAccount: { 
                              ...editData.payrollInfo?.bankAccount, 
                              accountNumber: e.target.value 
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Branch Code</Label>
                      <Input
                        value={editData.payrollInfo?.bankAccount?.branchCode || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          payrollInfo: { 
                            ...editData.payrollInfo, 
                            bankAccount: { 
                              ...editData.payrollInfo?.bankAccount, 
                              branchCode: e.target.value 
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeCompensation;
