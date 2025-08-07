import { Request } from 'express';

/**
 * Check if the current request should use demo mode
 * @param req Express request object
 * @returns boolean indicating if demo mode should be used
 */
export const shouldUseDemoMode = (req: Request): boolean => {
  return req.user?.isDemo || false;
};

/**
 * Return mock data if in demo mode, otherwise execute the real function
 * @param req Express request object
 * @param mockData Mock data to return if in demo mode
 * @param realDataFunction Function to execute for real data
 * @returns Promise resolving to either mock or real data
 */
export const handleDemoMode = async <T>(
  req: Request,
  mockData: T | (() => T),
  realDataFunction: () => Promise<T>
): Promise<T> => {
  if (shouldUseDemoMode(req)) {
    console.log('[DEBUG] Using demo mode - returning mock data');
    return typeof mockData === 'function' ? (mockData as () => T)() : mockData;
  }
  
  console.log('[DEBUG] Using real mode - executing database queries');
  return await realDataFunction();
};

/**
 * Return paginated mock data if in demo mode
 * @param req Express request object
 * @param mockData Array of mock data
 * @param realDataFunction Function to execute for real data
 * @returns Promise resolving to paginated data
 */
export const handleDemoModeWithPagination = async <T>(
  req: Request,
  mockData: T[],
  realDataFunction: () => Promise<{ data: T[], total: number, page: number, limit: number }>
): Promise<{ data: T[], total: number, page: number, limit: number }> => {
  if (shouldUseDemoMode(req)) {
    console.log('[DEBUG] Using demo mode - returning paginated mock data');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: mockData.slice(startIndex, endIndex),
      total: mockData.length,
      page,
      limit
    };
  }
  
  console.log('[DEBUG] Using real mode - executing database queries');
  return await realDataFunction();
};