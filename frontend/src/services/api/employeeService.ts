
import { apiClient } from '../apiClient';

// Type definitions for better type safety
interface GetEmployeesOptions {
  includeRelations?: boolean;
}

interface RenumberResult {
  totalEmployees: number;
  updates: Array<{ name: string; oldNumber: string; newNumber: string }>;
}

interface PreviewResult {
  totalEmployees: number;
  employeesAffected: number;
  employeesUnchanged: number;
  preview: Array<{
    name: string;
    position: string;
    department: string;
    currentNumber: string;
    proposedNumber: string;
    willChange: boolean;
    hireDate: string;
  }>;
}

// Get all employees with optional relations
export const getEmployees = async (options: GetEmployeesOptions = {}) => {
  const { includeRelations = true } = options;
  const response = await apiClient.get(`/employees?includeRelations=${includeRelations}`);
  return response.data;
};

/**
 * Renumber all employees sequentially starting from EMP001
 */
export const renumberAllEmployees = async (): Promise<RenumberResult> => {
  const response = await apiClient.post<{ data: RenumberResult }>('/employees/renumber-all');
  return response.data.data;
};

/**
 * Preview what renumbering all employees would look like
 */
export const previewRenumberEmployees = async (): Promise<PreviewResult> => {
  const response = await apiClient.get<{ data: PreviewResult }>('/employees/renumber-preview');
  return response.data.data;
};
