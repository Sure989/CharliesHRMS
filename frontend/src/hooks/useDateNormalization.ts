/**
 * Hook for handling date normalization across the application
 * Provides consistent date formatting and normalization functions
 */

import { useCallback } from 'react';
import { 
  normalizeDateForInput, 
  normalizeDateTimeForInput, 
  normalizeToISO, 
  formatDateSafe, 
  formatDateTimeSafe,
  getCurrentDateString,
  getCurrentISOString
} from '@/utils/dateUtils';

export const useDateNormalization = () => {
  /**
   * Normalize date for HTML date inputs (yyyy-MM-dd)
   */
  const normalizeDateInput = useCallback((date: string | Date | null | undefined): string => {
    return normalizeDateForInput(date);
  }, []);

  /**
   * Normalize datetime for HTML datetime-local inputs (yyyy-MM-ddTHH:mm)
   */
  const normalizeDateTimeInput = useCallback((date: string | Date | null | undefined): string => {
    return normalizeDateTimeForInput(date);
  }, []);

  /**
   * Normalize date to ISO string for API submission
   */
  const normalizeForAPI = useCallback((date: string | Date | null | undefined): string => {
    return normalizeToISO(date);
  }, []);

  /**
   * Format date for display with fallback
   */
  const formatDate = useCallback((date: string | Date | null | undefined, fallback: string = '-'): string => {
    return formatDateSafe(date, fallback);
  }, []);

  /**
   * Format datetime for display with fallback
   */
  const formatDateTime = useCallback((date: string | Date | null | undefined, fallback: string = '-'): string => {
    return formatDateTimeSafe(date, fallback);
  }, []);

  /**
   * Get current date in yyyy-MM-dd format
   */
  const getCurrentDate = useCallback((): string => {
    return getCurrentDateString();
  }, []);

  /**
   * Get current ISO timestamp
   */
  const getCurrentISO = useCallback((): string => {
    return getCurrentISOString();
  }, []);

  return {
    // Input normalization
    normalizeDateInput,
    normalizeDateTimeInput,
    
    // API normalization
    normalizeForAPI,
    
    // Display formatting
    formatDate,
    formatDateTime,
    
    // Current date/time
    getCurrentDate,
    getCurrentISO,
  };
};

export default useDateNormalization;
