import { useEffect, useState, useCallback, useRef } from 'react';

export interface PollingOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function usePolling<T = any>(
  fetchFn: () => Promise<T>,
  { interval = 30000, enabled = true, onError }: PollingOptions = {}
): [T | null, boolean, () => void] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchFnRef = useRef(fetchFn);
  const onErrorRef = useRef(onError);

  // Update refs without causing re-renders
  fetchFnRef.current = fetchFn;
  onErrorRef.current = onError;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFnRef.current();
      setData(result);
    } catch (error) {
      onErrorRef.current?.(error as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Fetch immediately
    fetchData();
    
    // Set up polling
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, fetchData]);

  return [data, loading, fetchData];
}