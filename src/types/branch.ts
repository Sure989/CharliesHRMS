export interface Branch {
  id: string;
  name: string;
  location?: string;
  address?: string;
  managerId?: string;
  departmentId: string;
  employeeCount?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  employees?: any[];
  department?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface BranchEmployee {
  employeeId: string;
  branchId: string;
  assignedDate: string;
  position: string;
  isActive: boolean;
}
