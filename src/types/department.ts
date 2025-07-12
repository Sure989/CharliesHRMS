export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  employees?: any[];
  employeeCount?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  branches?: any[];
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DepartmentEmployee {
  employeeId: string;
  departmentId: string;
  assignedDate: string;
  role: string;
  isActive: boolean;
}

// Predefined department IDs for consistency
export const DEPARTMENT_IDS = {
  FINANCE: 'finance',
  OPERATIONS: 'operations',
  MARKETING: 'marketing',
  HUMAN_RESOURCE: 'human_resource',
  ADMINISTRATION: 'administration',
  TECH: 'tech'
} as const;

export type DepartmentId = typeof DEPARTMENT_IDS[keyof typeof DEPARTMENT_IDS];
