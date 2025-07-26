import { PaginatedResponse } from '@/services/apiClient';

/**
 * Helper function to extract data from either a direct array or a paginated response
 * 
 * @param response Either an array or a PaginatedResponse object from the API
 * @returns The array of items, empty array if not available
 */
export function extractDataFromResponse<T>(
  response: T[] | PaginatedResponse<T> | undefined | null
): T[] {
  if (!response) {
    return [];
  }
  
  if (Array.isArray(response)) {
    return response;
  }
  
  return response.data || [];
}
