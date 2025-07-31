export interface Department {
  id: string;
  name: string;
  managerId: string;
  managerUserId: string;
  employeeCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  description?: string;
  employees?: any[];
}
