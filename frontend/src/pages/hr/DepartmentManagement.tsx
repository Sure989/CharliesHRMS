import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Building2, Users, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Department } from '@/types/department';
import { useAuth } from '@/contexts/AuthContext';
import { canManageDepartments } from '@/utils/permissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService, employeeService } from '@/services/api';
import { userService } from '@/services/api/user.service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractDataFromResponse } from '@/utils/api-helpers';
import { User } from '@/types/types';

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  managerId?: string;
  status?: string;
}

const DepartmentManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newDepartment, setNewDepartment] = useState<CreateDepartmentRequest>({
    name: '',
    description: '',
    managerId: undefined
  });

  const [editDepartment, setEditDepartment] = useState<UpdateDepartmentRequest>({
    name: '',
    description: '',
    managerId: undefined,
    status: 'ACTIVE'
  });

  // Fetch departments
  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
    isError: isDepartmentsError,
    error: departmentsError
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAllDepartments(),
  });

  // Fetch employees for manager selection
  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isEmployeesError
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  });

  // Fetch users for manager selection
  const {
    data: usersData = [],
    isLoading: isLoadingUsers,
    isError: isUsersError
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({ status: 'active' }),
  });

  // Extract data from possible paginated responses
  const employeesList = extractDataFromResponse(employees);

  // Extract users and map to employees for display
  const usersList: User[] = useMemo(() => {
    if (Array.isArray(usersData)) {
      return usersData;
    } else if (usersData && Array.isArray(usersData.data)) {
      return usersData.data;
    }
    return [];
  }, [usersData]);

  // Enhanced manager options with multiple fallback strategies
  const managerOptions = useMemo(() => {
    console.log('Creating manager options...');
    console.log('Users Data:', usersData);
    console.log('Users List:', usersList);
    console.log('Employees List:', employeesList);

    if (!usersList || !employeesList) {
      return [];
    }
    const options: Array<{userId: string; employeeName: string; source: string}> = [];
    usersList.forEach((user: User) => {
      let name = '';
      if (user.employeeId) {
        const emp = employeesList.find((e) => e.id === user.employeeId);
        if (emp && emp.firstName && emp.lastName) {
          name = `${emp.firstName} ${emp.lastName}`;
        }
      }
      if (!name && user.firstName && user.lastName) {
        name = `${user.firstName} ${user.lastName}`;
      }
      if (!name) {
        name = user.email;
      }
      options.push({
        userId: user.id,
        employeeName: name,
        source: 'auto'
      });
    });
    return options;
  }, [usersList, employeesList, usersData]);

  // Debug info
  console.log('Debug Info:', {
    selectedDepartment,
    editDepartment,
    usersList: usersList.slice(0, 3),
    employeesList: employeesList.slice(0, 3),
    managerOptions: managerOptions.slice(0, 3),
    isLoadingUsers,
    isUsersError,
    isLoadingEmployees,
    isEmployeesError,
    totalManagerOptions: managerOptions.length,
    totalUsers: usersList.length,
    totalEmployees: employeesList.length
  });
  const createDepartmentMutation = useMutation({
    mutationFn: (newDept: CreateDepartmentRequest) => 
      departmentService.createDepartment(newDept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsAddDialogOpen(false);
      setNewDepartment({
        name: '',
        description: '',
        managerId: undefined
      });
      toast({
        title: 'Department created',
        description: 'The department has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create department',
        description: error.message || 'An error occurred while creating the department.',
        variant: 'destructive',
      });
    }
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentRequest }) => 
      departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      toast({
        title: 'Department updated',
        description: 'The department has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update department',
        description: error.message || 'An error occurred while updating the department.',
        variant: 'destructive',
      });
    }
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Department deleted',
        description: 'The department has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete department',
        description: error.message || 'An error occurred while deleting the department.',
        variant: 'destructive',
      });
    }
  });

  const handleCreateDepartment = () => {
    createDepartmentMutation.mutate(newDepartment);
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) {
      toast({
        title: 'Error',
        description: 'No department selected for update.',
        variant: 'destructive'
      });
      return;
    }

    console.log('Updating department:', selectedDepartment.id, 'with data:', editDepartment);
    
    try {
      await updateDepartmentMutation.mutateAsync({
        id: selectedDepartment.id,
        data: editDepartment
      });
    } catch (error) {
      console.error('Department update error:', error);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setEditDepartment({
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || 'none', // Convert null/undefined to 'none'
      status: department.status || 'ACTIVE'
    });
    setIsEditDialogOpen(true);
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter((dept: Department) => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if user has permission to manage departments
  const canManage = canManageDepartments(user);

  // If user doesn't have permission, show alert
  if (!canManage) {
    return (
      <DashboardLayout title="Department Management">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to manage departments. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  console.log('Debug Info:', {
    selectedDepartment,
    editDepartment,
    usersList: usersList.slice(0, 3), // First 3 users
    employeesList: employeesList.slice(0, 3), // First 3 employees
    managerOptions: managerOptions.slice(0, 3), // First 3 options
    isLoadingUsers,
    isUsersError,
    usersData: typeof usersData,
    totalManagerOptions: managerOptions.length
  });
  
  console.log('Employees List:', employeesList);
  console.log('Users List:', usersList);
  console.log('Manager Options:', managerOptions);
  console.log('Users with employeeId:', usersList.filter((user: User) => user.employeeId));
  console.log('Employees:', employeesList);

  return (
    <DashboardLayout title="Department Management">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Manage your organization's departments</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="mr-2 h-4 w-4 text-white" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoadingDepartments ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isDepartmentsError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(departmentsError as Error)?.message || 'Failed to load departments'}
              </AlertDescription>
            </Alert>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No departments found. {searchTerm ? 'Try a different search term.' : 'Add a department to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department: Department) => {
                  // Find the manager in usersList by user.id
                  const manager = usersList.find(user => user.id === department.managerId);
                  return (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>
                        {department.description ? 
                          department.description.length > 50 
                            ? `${department.description.substring(0, 50)}...` 
                            : department.description 
                          : 'No description'}
                      </TableCell>
                  <TableCell>
                    {manager 
                      ? [manager.firstName, manager.lastName].filter(Boolean).join(' ') || manager.email
                      : 'None'}
                  </TableCell>
                      <TableCell>
                        {department.employees?.length || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={department.status === 'ACTIVE' ? 'default' : 'secondary'}
                        >
                          {department.status || 'ACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(department)}
                          className="hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDepartment(department.id)}
                          disabled={deleteDepartmentMutation.isPending}
                          className="hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new department in your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                placeholder="Enter department name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter department description"
                value={newDepartment.description || ''}
                onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager</Label>
              <Select
                value={newDepartment.managerId || 'none'}
                onValueChange={(value) => setNewDepartment({ ...newDepartment, managerId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : isUsersError ? (
                    <div className="flex items-center justify-center p-2 text-red-500">
                      Error loading users
                    </div>
                  ) : managerOptions.length === 0 ? (
                    <div className="flex items-center justify-center p-2 text-gray-500">
                      No managers available
                    </div>
                  ) : (
                    managerOptions.map((option) => (
                      <SelectItem key={option.userId} value={option.userId}>
                        {option.employeeName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-400 text-gray-700 hover:bg-gray-100">Cancel</Button>
            <Button onClick={handleCreateDepartment} disabled={!newDepartment.name || createDepartmentMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {createDepartmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
              Create Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter department name"
                value={editDepartment.name || ''}
                onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter department description"
                value={editDepartment.description || ''}
                onChange={(e) => setEditDepartment({ ...editDepartment, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">Department Manager</Label>
              <Select
                value={editDepartment.managerId || 'none'}
                onValueChange={(value) => setEditDepartment({ ...editDepartment, managerId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : isUsersError ? (
                    <div className="flex items-center justify-center p-2 text-red-500">
                      Error loading users
                    </div>
                  ) : managerOptions.length === 0 ? (
                    <div className="flex items-center justify-center p-2 text-gray-500">
                      No managers available
                    </div>
                  ) : (
                    managerOptions.map((option) => (
                      <SelectItem key={option.userId} value={option.userId}>
                        {option.employeeName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editDepartment.status || 'ACTIVE'}
                onValueChange={(value) => setEditDepartment({ ...editDepartment, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-400 text-gray-700 hover:bg-gray-100">Cancel</Button>
            <Button onClick={handleUpdateDepartment} disabled={!editDepartment.name || updateDepartmentMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {updateDepartmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
              Update Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Across the organization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Departments</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => d.status === 'ACTIVE' || !d.status).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((total, dept) => total + (dept.employees?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Assigned to departments</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentManagement;
