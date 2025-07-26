import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Edit, Trash2, Shield, Search, Settings, Key, UserCheck, UserX, Loader2, Eye, EyeOff } from 'lucide-react';
import { userService, CreateUserRequest } from '@/services/api/user.service';
import { branchService } from '@/services/api/branch.service';
import { employeeService } from '@/services/api/employee.service';
import { User, Branch } from '@/types/types';

const initialAddUser = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '',
};

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  // Department filter removed
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string; permissions: string[] }>>([]);
  // const [departments, setDepartments] = useState<Array<{ id: string; name: string; description: string }>>([]);
  // const [branches, setBranches] = useState<Branch[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0, adminUsers: 0, hrManagerUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ [userId: string]: any }>({});
  const [passwordFields, setPasswordFields] = useState<{ [userId: string]: { newPassword: string; confirmPassword: string } }>({});
  const [passwordVisibility, setPasswordVisibility] = useState<{ [userId: string]: { new: boolean; confirm: boolean } }>({});
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUser, setAddUser] = useState(initialAddUser);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserErrors, setAddUserErrors] = useState<{ [k: string]: string }>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [usersResponse, rolesResponse, branchesResponse, permissionsResponse, statsResponse] = await Promise.all([
        userService.getUsers(),
        userService.getRoles(),
        branchService.getAllBranches(),
        userService.getPermissions(),
        userService.getUserStats()
      ]);

      let users: User[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];

      // No branch merging needed
      setUsers(users);
      setRoles(Array.isArray(rolesResponse) ? rolesResponse : []);
      // setDepartments(Array.isArray(departmentsResponse) ? departmentsResponse : []);
      // setDepartments(Array.isArray(departmentsResponse) ? departmentsResponse : []);
      // Departments loading removed due to missing API
      setPermissions(Array.isArray(permissionsResponse) ? permissionsResponse : []);
      setUserStats(statsResponse || { totalUsers: 0, activeUsers: 0, adminUsers: 0, hrManagerUsers: 0 });

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load user data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'HR_MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'OPERATIONS_MANAGER':
        return 'bg-purple-100 text-purple-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to safely get string value
  const safeToString = (val: any) => (val !== undefined && val !== null ? val.toString() : '');

  // Helper to get department/branch name by ID
  // const getDepartmentName = (id: string | null) => {
  //   if (!id) return 'None';
  //   const dept = departments.find(d => d.id === id);
  //   return dept ? dept.name : 'None';
  // };
  // const getBranchName = (id: string | null) => {
  //   if (!id) return 'None';
  //   const branch = branches.find(b => b.id === id);
  //   return branch ? branch.name : 'None';
  // };

  // Defensive filter: only include valid user objects
  const filteredUsers = useMemo(() => users.filter(user => {
    if (!user || typeof user !== 'object') return false;
    // Defensive: check for required fields
    if (!('status' in user) || !('role' in user) || !('firstName' in user)) return false;
    const matchesSearch = (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole || safeToString(user.role) === filterRole;
    const matchesStatus = filterStatus === 'all' || (user.status?.toUpperCase() === filterStatus.toUpperCase());
    return matchesSearch && matchesRole && matchesStatus;
  }), [users, searchTerm, filterRole, filterStatus]);

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: "User Deleted",
        description: "User has been successfully removed from the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updatedUser = await userService.updateUserStatus(userId, newStatus);
      if (updatedUser && typeof updatedUser.status !== 'undefined') {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: updatedUser.status } : u));
        toast({
          title: "User Status Updated",
          description: `User status changed to ${newStatus}.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update user status. Invalid response from server.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    // Only send allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'email', 'role', 'status', 'department', 'permissions'
    ];
    const sanitizedData: any = {};
    allowedFields.forEach(field => {
      if (userData && userData[field] !== undefined) {
        sanitizedData[field] = userData[field];
      }
    });
    console.log('Updating user:', userId, sanitizedData); // DEBUG
    try {
      const updatedUser = await userService.updateUser(userId, sanitizedData);
      setUsers(prev => prev.map(u => u.id === userId && updatedUser ? updatedUser : u));
      toast({
        title: "User Updated",
        description: "User details have been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      await userService.changeUserPassword({ userId, newPassword });
      toast({
        title: "Password Reset",
        description: "User password has been successfully reset.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermissions = async (userId: string, permissions: string[]) => {
    try {
      const updatedUser = await userService.updateUserPermissions(userId, permissions);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      toast({
        title: "Permissions Updated",
        description: "User permissions have been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions.",
        variant: "destructive",
      });
    }
  };

  const availablePermissions = [
    'user_management',
    'system_admin',
    'reports',
    'workflow_management',
    'salary_advances',
    'leave_management',
    'employee_management',
    'performance_management',
    'branch_management',
    'leave_approval',
    'salary_advance_approval',
    'staff_scheduling',
    'profile_view',
    'leave_request',
    'salary_advance_request',
    'staff_coordination'
  ];

  const getPermissionsByRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['user_management', 'system_admin', 'reports', 'workflow_management', 'salary_advances', 'leave_management'];
      case 'hr_manager':
        return ['employee_management', 'leave_management', 'salary_advances', 'reports', 'performance_management'];
      case 'operations_manager':
        return ['branch_management', 'leave_approval', 'salary_advance_approval', 'staff_scheduling', 'reports'];
      case 'employee':
        return ['profile_view', 'leave_request', 'salary_advance_request'];
      default:
        return ['profile_view'];
    }
  };

  // Add User logic
  const validateAddUser = (data: typeof initialAddUser) => {
    const errors: { [k: string]: string } = {};
    if (!data.firstName.trim()) errors.firstName = 'First name is required';
    if (!data.lastName.trim()) errors.lastName = 'Last name is required';
    if (!data.email.trim()) errors.email = 'Email is required';
    if (!data.password.trim() || data.password.length < 6) errors.password = 'Password (min 6 chars) is required';
    if (!data.role) errors.role = 'Role is required';
    return errors;
  };

  const handleAddUser = async () => {
    const errors = validateAddUser(addUser);
    setAddUserErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setAddUserLoading(true);
    try {
      // Only create employee, backend will auto-create user
      // Match the expected type for employeeService.createEmployee
      await employeeService.createEmployee({
        firstName: addUser.firstName.trim(),
        lastName: addUser.lastName.trim(),
        email: addUser.email.trim(),
        position: addUser.role, // or set to a default/empty string if needed
        hireDate: new Date().toISOString(),
        phone: '',
        department: '', // Provide a default or select value if available
        branch: '',     // Provide a default or select value if available
      });
      // Reload users to ensure correct department/branch display
      await loadData();
      setAddUser(initialAddUser);
      setAddUserDialogOpen(false);
      setAddUserErrors({});
      toast({ title: 'User Added', description: `${addUser.firstName} ${addUser.lastName} has been added.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add user.', variant: 'destructive' });
    } finally {
      setAddUserLoading(false);
    }
  };

  // Helper type guard for objects with a name property
  function hasNameProp(obj: any): obj is { name: string } {
    return obj && typeof obj === 'object' && 'name' in obj;
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalUsers ?? users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.activeUsers ?? users.filter(u => u.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.adminUsers ?? users.filter(u => u.role === 'ADMIN').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Managers</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.hrManagerUsers ?? users.filter(u => u.role === 'HR_MANAGER').length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage system users and their access</CardDescription>
                  </div>
                  <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <UserPlus className="mr-2 h-4 w-4 text-white" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new user account</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={addUser.firstName} onChange={e => setAddUser(a => ({ ...a, firstName: e.target.value }))} placeholder="Enter first name" />
                            {addUserErrors.firstName && <div className="text-xs text-red-500">{addUserErrors.firstName}</div>}
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={addUser.lastName} onChange={e => setAddUser(a => ({ ...a, lastName: e.target.value }))} placeholder="Enter last name" />
                            {addUserErrors.lastName && <div className="text-xs text-red-500">{addUserErrors.lastName}</div>}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={addUser.email} onChange={e => setAddUser(a => ({ ...a, email: e.target.value }))} placeholder="Enter email address" />
                          {addUserErrors.email && <div className="text-xs text-red-500">{addUserErrors.email}</div>}
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" value={addUser.password} onChange={e => setAddUser(a => ({ ...a, password: e.target.value }))} placeholder="Set initial password" />
                          {addUserErrors.password && <div className="text-xs text-red-500">{addUserErrors.password}</div>}
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={addUser.role} onValueChange={val => setAddUser(a => ({ ...a, role: val }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {addUserErrors.role && <div className="text-xs text-red-500">{addUserErrors.role}</div>}
                        </div>
                        {/* Department and Branch fields removed */}
                        <Button className="w-full" onClick={handleAddUser} disabled={addUserLoading}>
                          {addUserLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Create User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles
                        .filter(role => role && role.id && safeToString(role.id).trim() && role.name && role.name.trim())
                        .map(role => (
                          <SelectItem key={safeToString(role.id)} value={safeToString(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {/* Department filter removed due to missing departments API */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {/* Department and Branch columns removed */}
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      user ? (
                        <TableRow key={user?.id || Math.random()}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user?.firstName || ''} {user?.lastName || ''}</div>
                              <div className="text-sm text-muted-foreground">{user?.employeeId || ''}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user?.email || ''}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user?.role || '')}>
                              {(user?.role || '').replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          {/* Department and Branch cells removed */}
                          <TableCell>
                          <Badge className={getStatusBadgeColor(user?.status || '')}>
                              {user?.status ? user.status.charAt(0) + user.status.slice(1).toLowerCase() : ''}
                          </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* Edit User Dialog Trigger */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="hover:bg-blue-100">
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit User: {user.firstName} {user.lastName}</DialogTitle>
                                    <DialogDescription>Update user details, role, permissions, and password.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    {/* Basic User Info */}
                                    <div className="space-y-4">
                                      <h4 className="font-semibold">Basic Information</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor={`edit-firstName-${user.id}`}>First Name</Label>
                                          <Input id={`edit-firstName-${user.id}`} defaultValue={user.firstName} onChange={e => setEditFields(f => ({ ...f, [user.id]: { ...f[user.id], firstName: e.target.value } }))} />
                                        </div>
                                        <div>
                                          <Label htmlFor={`edit-lastName-${user.id}`}>Last Name</Label>
                                          <Input id={`edit-lastName-${user.id}`} defaultValue={user.lastName} onChange={e => setEditFields(f => ({ ...f, [user.id]: { ...f[user.id], lastName: e.target.value } }))} />
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                                        <Input id={`edit-email-${user.id}`} type="email" defaultValue={user.email} onChange={e => setEditFields(f => ({ ...f, [user.id]: { ...f[user.id], email: e.target.value } }))} />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        {/* Department and Branch fields removed from edit dialog */}
                                      </div>
                                    </div>

                                    {/* Role & Status Management */}
                                    <div className="space-y-4 border-t pt-4">
                                      <h4 className="font-semibold">Role & Status</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor={`edit-role-${user.id}`}>Role</Label>
                                          <Select defaultValue={user.role} onValueChange={val => setEditFields(f => ({ ...f, [user.id]: { ...f[user.id], role: val } }))}>
                                            <SelectTrigger id={`edit-role-${user.id}`}>
                                              <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="ADMIN">Administrator</SelectItem>
                                              <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                                              <SelectItem value="OPERATIONS_MANAGER">Operations Manager</SelectItem>
                                              <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label htmlFor={`edit-status-${user.id}`}>Status</Label>
                                          <Select defaultValue={user.status} onValueChange={val => setEditFields(f => ({ ...f, [user.id]: { ...f[user.id], status: val } }))}>
                                            <SelectTrigger id={`edit-status-${user.id}`}>
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="active">Active</SelectItem>
                                              <SelectItem value="inactive">Inactive</SelectItem>
                                              <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Permissions Management */}
                                    <div className="space-y-4 border-t pt-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Permissions</h4>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const rolePermissions = getPermissionsByRole(user.role);
                                            // TODO: Update permissions checkboxes based on role
                                          }}
                                        >
                                          <Settings className="h-4 w-4 mr-1" />
                                          Set by Role
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                                        {availablePermissions.map((permission) => (
                                          <div key={permission} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`permission-${user.id}-${permission}`}
                                              defaultChecked={user.permissions?.includes(permission)}
                                            />
                                            <Label
                                              htmlFor={`permission-${user.id}-${permission}`}
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Current permissions: {user.permissions?.length || 0} selected
                                      </div>
                                    </div>

                                    {/* Password Reset Section */}
                                    <div className="border-t pt-4 space-y-4">
                                      <h4 className="font-semibold flex items-center">
                                        <Key className="h-4 w-4 mr-2" />
                                        Password Management
                                      </h4>
                                      <div className="space-y-2">
                                        <Label htmlFor={`new-password-${user.id}`}>New Password</Label>
                                        <div className="relative">
                                          <Input
                                            id={`new-password-${user.id}`}
                                            type={passwordVisibility[user.id]?.new ? "text" : "password"}
                                            placeholder="Enter new password"
                                            onChange={e => setPasswordFields(f => ({ ...f, [user.id]: { ...f[user.id], newPassword: e.target.value } }))}
                                            value={passwordFields[user.id]?.newPassword || ""}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2"
                                            onClick={() => setPasswordVisibility(v => ({ ...v, [user.id]: { ...v[user.id], new: !v[user.id]?.new } }))}
                                            tabIndex={-1}
                                          >
                                            {passwordVisibility[user.id]?.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                          </Button>
                                        </div>
                                        <Label htmlFor={`confirm-password-${user.id}`}>Confirm Password</Label>
                                        <div className="relative">
                                          <Input
                                            id={`confirm-password-${user.id}`}
                                            type={passwordVisibility[user.id]?.confirm ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            onChange={e => setPasswordFields(f => ({ ...f, [user.id]: { ...f[user.id], confirmPassword: e.target.value } }))}
                                            value={passwordFields[user.id]?.confirmPassword || ""}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2"
                                            onClick={() => setPasswordVisibility(v => ({ ...v, [user.id]: { ...v[user.id], confirm: !v[user.id]?.confirm } }))}
                                            tabIndex={-1}
                                          >
                                            {passwordVisibility[user.id]?.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                          </Button>
                                        </div>
                                        <Button variant="secondary" size="sm" className="w-full" onClick={() => handleResetPassword(user.id, passwordFields[user.id]?.newPassword)}>
                                          Reset Password
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-4">
                                      <Button className="flex-1" onClick={() => handleUpdateUser(user.id, editFields[user.id])}>
                                        Save All Changes
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleUpdatePermissions(user.id, user.permissions || [])}
                                      >
                                        Update Permissions Only
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id, user.status)} className={user.status === 'active' ? 'hover:bg-yellow-100' : 'hover:bg-green-100'}>
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)} className="hover:bg-red-100">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage system roles and their permissions for the nightclub/restaurant HRMS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Role Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        role: 'ADMIN',
                        name: 'Administrator',
                        description: 'Full system access and user management',
                        userCount: users.filter(u => u.role === 'ADMIN').length,
                        permissions: getPermissionsByRole('admin')
                      },
                      {
                        role: 'HR_MANAGER',
                        name: 'HR Manager',
                        description: 'Employee management and HR operations',
                        userCount: users.filter(u => u.role === 'HR_MANAGER').length,
                        permissions: getPermissionsByRole('hr_manager')
                      },
                      {
                        role: 'OPERATIONS_MANAGER',
                        name: 'Operations Manager',
                        description: 'Branch management and operational oversight',
                        userCount: users.filter(u => u.role === 'OPERATIONS_MANAGER').length,
                        permissions: getPermissionsByRole('operations_manager')
                      },
                      {
                        role: 'EMPLOYEE',
                        name: 'Employee',
                        description: 'Basic employee access and self-service',
                        userCount: users.filter(u => u.role === 'EMPLOYEE').length,
                        permissions: getPermissionsByRole('employee')
                      }
                    ].map((roleInfo) => (
                      <Card key={roleInfo.role} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{roleInfo.name}</CardTitle>
                              <Badge className={getRoleBadgeColor(roleInfo.role)} variant="secondary">
                                {roleInfo.userCount} users
                              </Badge>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Settings className="h-4 w-4 mr-1" />
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Manage {roleInfo.name} Permissions</DialogTitle>
                                  <DialogDescription>
                                    Configure permissions for {roleInfo.name} role in the nightclub/restaurant HRMS
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="text-sm text-muted-foreground">
                                    {roleInfo.description}
                                  </div>
                                  <div className="space-y-3">
                                    <h4 className="font-semibold">Current Permissions</h4>
                                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded p-3">
                                      {availablePermissions.map((permission) => (
                                        <div key={permission} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`role-permission-${roleInfo.role}-${permission}`}
                                            defaultChecked={roleInfo.permissions.includes(permission)}
                                          />
                                          <Label
                                            htmlFor={`role-permission-${roleInfo.role}-${permission}`}
                                            className="text-sm font-normal cursor-pointer"
                                          >
                                            {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                      {roleInfo.permissions.length} permissions assigned
                                    </div>
                                    <Button onClick={() => {
                                      toast({
                                        title: "Role Updated",
                                        description: `Permissions for ${roleInfo.name} have been updated.`,
                                      });
                                    }}>
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">{roleInfo.description}</p>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Key Permissions:</div>
                            <div className="flex flex-wrap gap-1">
                              {roleInfo.permissions.slice(0, 4).map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))}
                              {roleInfo.permissions.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{roleInfo.permissions.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Permission Matrix */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Permission Matrix</CardTitle>
                      <CardDescription>Overview of permissions across all roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Permission</TableHead>
                              <TableHead className="text-center">Admin</TableHead>
                              <TableHead className="text-center">HR Manager</TableHead>
                              <TableHead className="text-center">Operations Manager</TableHead>
                              <TableHead className="text-center">Employee</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {availablePermissions.map((permission) => (
                              <TableRow key={permission}>
                                <TableCell className="font-medium">
                                  {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getPermissionsByRole('admin').includes(permission) ? (
                                    <UserCheck className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getPermissionsByRole('hr_manager').includes(permission) ? (
                                    <UserCheck className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getPermissionsByRole('operations_manager').includes(permission) ? (
                                    <UserCheck className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getPermissionsByRole('employee').includes(permission) ? (
                                    <UserCheck className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
