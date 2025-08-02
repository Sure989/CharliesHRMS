/**
 * Date utility functions for consistent ISO time handling across the application
 */

/**
 * Get current date as ISO string
 */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

/**
 * Get current date formatted for date inputs (YYYY-MM-DD)
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format date to ISO string, handling various input types
 */
export const toISOString = (date: Date | string | number): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
};

/**
 * Format date for display in local timezone
 */
export const formatLocalDate = (isoString: string): string => {
  try {
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date and time for display in local timezone
 */
export const formatLocalDateTime = (isoString: string): string => {
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Calculate days between two dates
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays + 1); // +1 to include both start and end dates
  } catch {
    return 1;
  }
};

/**
 * Get start of month as ISO string
 */
export const getStartOfMonthISO = (date?: Date): string => {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

/**
 * Get end of month as ISO string
 */
export const getEndOfMonthISO = (date?: Date): string => {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
};

/**
 * Get date N days from now as ISO string
 */
export const getDateFromNowISO = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

/**
 * Check if date is within the last N hours
 */
export const isWithinLastHours = (dateString: string, hours: number): boolean => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours <= hours;
  } catch {
    return false;
  }
};

/**
 * Format filename with current date
 */
export const formatFilenameWithDate = (baseName: string, extension: string): string => {
  const dateStr = getCurrentDateString();
  return `${baseName}-${dateStr}.${extension}`;
};

/**
 * Normalize date to yyyy-MM-dd format for date inputs
 * Handles ISO strings, Date objects, and already formatted dates
 */
export const normalizeDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    // If it's already in yyyy-MM-dd format, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Convert to Date object and format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Normalize date/time for datetime-local inputs (yyyy-MM-ddTHH:mm)
 */
export const normalizeDateTimeForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    // Format to yyyy-MM-ddTHH:mm for datetime-local inputs
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

/**
 * Convert various date formats to ISO string for API submission
 */
export const normalizeToISO = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    // If it's already an ISO string with time, return as is
    if (typeof date === 'string' && date.includes('T') && date.includes('Z')) {
      return date;
    }
    
    // If it's a date-only string (yyyy-MM-dd), add default time
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Date(date + 'T00:00:00.000Z').toISOString();
    }
    
    return new Date(date).toISOString();
  } catch {
    return '';
  }
};

/**
 * Safe date formatting for display with fallback
 */
export const formatDateSafe = (date: string | Date | null | undefined, fallback: string = '-'): string => {
  if (!date) return fallback;
  
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return fallback;
  }
};

/**
 * Safe date-time formatting for display with fallback
 */
export const formatDateTimeSafe = (date: string | Date | null | undefined, fallback: string = '-'): string => {
  if (!date) return fallback;
  
  try {
    return new Date(date).toLocaleString();
  } catch {
    return fallback;
  }
};
