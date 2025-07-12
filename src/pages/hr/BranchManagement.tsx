import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Edit, Trash2, Building, Users, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Branch } from '@/types/branch';
import { useAuth } from '@/contexts/AuthContext';
import { canManageBranches } from '@/utils/permissions';
import { branchService, departmentService, employeeService } from '@/services/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractDataFromResponse } from '@/utils/api-helpers';

export interface CreateBranchRequest {
  name: string;
  location?: string;
  address?: string;
  managerId?: string;
  departmentId: string;
}

export interface UpdateBranchRequest {
  name?: string;
  location?: string;
  address?: string;
  managerId?: string;
  departmentId?: string;
  status?: string;
}

const BranchManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newBranch, setNewBranch] = useState<CreateBranchRequest>({
    name: '',
    location: '',
    address: '',
    managerId: undefined,
    departmentId: ''
  });
  const [editBranch, setEditBranch] = useState<UpdateBranchRequest>({
    name: '',
    location: '',
    address: '',
    managerId: undefined,
    departmentId: '',
    status: 'ACTIVE'
  });

  // Fetch branches
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    isError: isBranchesError,
    error: branchesError
  } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAllBranches(),
  });

  // Fetch departments
  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
    isError: isDepartmentsError
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAllDepartments(),
  });

  // Fetch employees
  const {
    data: employeesResponse,
    isLoading: isLoadingEmployees,
    isError: isEmployeesError
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  });
  const employees = extractDataFromResponse(employeesResponse);

  // Mutations
  const createBranchMutation = useMutation({
    mutationFn: (data: CreateBranchRequest) => branchService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsAddDialogOpen(false);
      setNewBranch({ name: '', location: '', address: '', managerId: undefined, departmentId: '' });
      toast({ title: 'Branch created', description: 'The branch has been created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create branch', description: error.message || 'An error occurred.', variant: 'destructive' });
    }
  });
  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchRequest }) => branchService.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsEditDialogOpen(false);
      setSelectedBranch(null);
      toast({ title: 'Branch updated', description: 'The branch has been updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update branch', description: error.message || 'An error occurred.', variant: 'destructive' });
    }
  });
  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => branchService.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({ title: 'Branch deleted', description: 'The branch has been deleted successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete branch', description: error.message || 'An error occurred.', variant: 'destructive' });
    }
  });

  // Helper to check if branch has employees before delete
  const getBranchEmployeesQuery = async (branchId: string) => {
    try {
      const employees = await branchService.getBranchEmployees(branchId);
      return employees.length > 0;
    } catch {
      return false;
    }
  };

  // Handlers
  const handleCreateBranch = () => createBranchMutation.mutate(newBranch);
  const handleUpdateBranch = async () => {
    if (!selectedBranch) {
      toast({
        title: 'Error',
        description: 'No branch selected for update.',
        variant: 'destructive'
      });
      return;
    }

    console.log('Updating branch:', selectedBranch.id, 'with data:', editBranch);
    
    try {
      await updateBranchMutation.mutateAsync({ id: selectedBranch.id, data: editBranch });
    } catch (error) {
      console.error('Branch update error:', error);
    }
  };
  const handleDeleteBranch = async (id: string) => {
    const hasEmployees = await getBranchEmployeesQuery(id);
    if (hasEmployees) {
      toast({ title: 'Cannot Delete Branch', description: 'This branch has employees assigned. Please reassign them first.', variant: 'destructive' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      deleteBranchMutation.mutate(id);
    }
  };
  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setEditBranch({
      name: branch.name,
      location: branch.location || '',
      address: branch.address || '',
      managerId: branch.managerId || undefined,
      departmentId: branch.departmentId,
      status: branch.status || 'ACTIVE',
    });
    setIsEditDialogOpen(true);
  };

  // Filtering
  const filteredBranches = branches.filter((branch: Branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (branch.location && branch.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Permissions
  const canManage = canManageBranches(user);
  if (!canManage) {
    return (
      <DashboardLayout title="Branch Management">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to manage branches. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Branch Management">
      {/* Branches Table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Branches</CardTitle>
              <CardDescription>Manage your organization's branches</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="mr-2 h-4 w-4 text-white" />
              Add Branch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoadingBranches ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isBranchesError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(branchesError as Error)?.message || 'Failed to load branches'}
              </AlertDescription>
            </Alert>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No branches found. {searchTerm ? 'Try a different search term.' : 'Add a branch to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch: Branch) => {
                  const department = departments.find(dep => dep.id === branch.departmentId);
                  const manager = employees.find(emp => emp.id === branch.managerId);
                  return (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.location || 'N/A'}</TableCell>
                      <TableCell>{department ? department.name : 'N/A'}</TableCell>
                      <TableCell>{manager ? `${manager.firstName} ${manager.lastName}` : 'None'}</TableCell>
                      <TableCell>
                        <Badge variant={branch.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {branch.status || 'ACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(branch)} className="hover:bg-blue-100">
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBranch(branch.id)} disabled={deleteBranchMutation.isPending} className="hover:bg-red-100">
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

      {/* Add Branch Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
            <DialogDescription>Create a new branch in your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name *</Label>
              <Input id="name" placeholder="Enter branch name" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Enter branch location" value={newBranch.location || ''} onChange={e => setNewBranch({ ...newBranch, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Enter branch address" value={newBranch.address || ''} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={newBranch.departmentId} onValueChange={value => setNewBranch({ ...newBranch, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDepartments ? (
                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : (
                    departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Branch Manager</Label>
              <Select value={newBranch.managerId === 'none' ? undefined : newBranch.managerId || ''} onValueChange={value => setNewBranch({ ...newBranch, managerId: value === 'none' ? undefined : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {isLoadingEmployees ? (
                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : (
                    employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-400 text-gray-700 hover:bg-gray-100">Cancel</Button>
            <Button onClick={handleCreateBranch} disabled={!newBranch.name || !newBranch.departmentId || createBranchMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {createBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
              Create Branch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>Update branch information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Branch Name *</Label>
              <Input id="edit-name" placeholder="Enter branch name" value={editBranch.name || ''} onChange={e => setEditBranch({ ...editBranch, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" placeholder="Enter branch location" value={editBranch.location || ''} onChange={e => setEditBranch({ ...editBranch, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea id="edit-address" placeholder="Enter branch address" value={editBranch.address || ''} onChange={e => setEditBranch({ ...editBranch, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department *</Label>
              <Select value={editBranch.departmentId || ''} onValueChange={value => setEditBranch({ ...editBranch, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDepartments ? (
                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : (
                    departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">Branch Manager</Label>
              <Select value={editBranch.managerId === 'none' ? undefined : editBranch.managerId || ''} onValueChange={value => setEditBranch({ ...editBranch, managerId: value === 'none' ? undefined : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {isLoadingEmployees ? (
                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : (
                    employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editBranch.status || 'ACTIVE'} onValueChange={value => setEditBranch({ ...editBranch, status: value })}>
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
            <Button onClick={handleUpdateBranch} disabled={!editBranch.name || !editBranch.departmentId || updateBranchMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {updateBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
              Update Branch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">Across the organization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter(b => b.status === 'ACTIVE' || !b.status).length}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <MapPin className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">With branches</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchManagement;
