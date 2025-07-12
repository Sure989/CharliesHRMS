import { useState, useEffect, useCallback } from 'react';
import { config } from '@/config/environment';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  dependencies?: any[];
}

/**
 * Custom hook for API data fetching with loading states
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (config.enableDebugLogs) {
        console.error('API call failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, ...dependencies]); // Remove fetchData from dependencies to prevent loops

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  };
}

/**
 * Hook for API mutations (POST, PUT, DELETE operations)
 */
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await mutationFn(variables);
      
      if (options.onSuccess) {
        options.onSuccess(result, variables);
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage, variables);
      }
      
      if (config.enableDebugLogs) {
        console.error('API mutation failed:', err);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset
  };
}

/**
 * Hook for paginated API data
 */
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number, filters?: any) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>,
  options: {
    initialPage?: number;
    pageSize?: number;
    filters?: any;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
  } = {}
) {
  const {
    initialPage = 1,
    pageSize = 10,
    filters,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: pageSize,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (page: number = pagination.page) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall(page, pageSize, filters);
      setData(result.data);
      setPagination(result.pagination);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (config.enableDebugLogs) {
        console.error('Paginated API call failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, pageSize, filters, pagination.page, onSuccess, onError]);

  const goToPage = useCallback((page: number) => {
    fetchData(page);
  }, [fetchData]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.page, goToPage]);

  const refresh = useCallback(() => {
    fetchData(pagination.page);
  }, [fetchData, pagination.page]);

  useEffect(() => {
    fetchData(initialPage);
  }, [filters]); // Re-fetch when filters change

  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPrevPage: pagination.page > 1
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(
  initialData: T[],
  keyField: keyof T = 'id' as keyof T
) {
  const [data, setData] = useState<T[]>(initialData);

  const addOptimistic = useCallback((item: T) => {
    setData(prev => [...prev, item]);
  }, []);

  const updateOptimistic = useCallback((id: any, updates: Partial<T>) => {
    setData(prev => prev.map(item => 
      item[keyField] === id ? { ...item, ...updates } : item
    ));
  }, [keyField]);

  const removeOptimistic = useCallback((id: any) => {
    setData(prev => prev.filter(item => item[keyField] !== id));
  }, [keyField]);

  const revertOptimistic = useCallback((originalData: T[]) => {
    setData(originalData);
  }, []);

  const syncData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  return {
    data,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    revertOptimistic,
    syncData
  };
}

/**
 * Hook for real-time data updates with improved error handling and resource cleanup
 */
export function useRealTimeData<T>(
  apiCall: () => Promise<T>,
  options: {
    interval?: number;
    enabled?: boolean;
    onUpdate?: (data: T) => void;
  } = {}
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onUpdate
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    // Don't fetch if already loading to prevent overlapping requests
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      setData(result);
      setRetryCount(0); // Reset retry count on success
      
      if (onUpdate) {
        onUpdate(result);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      if (config.enableDebugLogs) {
        console.error('Real-time data fetch failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, onUpdate]); // Remove loading from dependencies

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Set up interval with exponential backoff on errors
    const effectiveInterval = retryCount > 0 ? Math.min(interval * Math.pow(2, retryCount), 300000) : interval;
    const intervalId = setInterval(() => {
      // Only fetch if not currently loading
      if (!loading) {
        fetchData();
      }
    }, effectiveInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, retryCount]); // Remove fetchData from dependencies

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}
