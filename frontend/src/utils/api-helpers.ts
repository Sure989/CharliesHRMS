import { PaginatedResponse } from '@/services/apiClient';

/**
 * Extracts data from API response
 * Handles both { data: { data: ... } } and { data: ... } response formats
 */
export function extractDataFromResponse(response: any) {
  if (!response) return [];
  
  // Handle case where response is { data: { data: ... } }
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  // Handle case where response is { data: ... }
  if (response.data) {
    return response.data;
  }
  
  // If response is already the data array
  return response;
}