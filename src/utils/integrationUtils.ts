import React from 'react';
import { CreditCard, Building, FileText, Link } from 'lucide-react';

/**
 * Get the appropriate badge styling for integration status
 */
export const getIntegrationStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the appropriate icon for integration type
 */
export const getIntegrationIcon = (type: string): React.ReactElement => {
  switch (type?.toUpperCase()) {
    case 'API':
      return React.createElement(CreditCard, { className: "h-4 w-4 text-blue-500" });
    case 'WEBHOOK':
      return React.createElement(Building, { className: "h-4 w-4 text-green-600" });
    case 'SMTP':
      return React.createElement(FileText, { className: "h-4 w-4 text-orange-500" });
    default:
      return React.createElement(Link, { className: "h-4 w-4 text-gray-400" });
  }
};

/**
 * Format duration from milliseconds to human-readable format
 */
export const formatDuration = (ms: number | undefined): string => {
  if (!ms || isNaN(ms)) return '-';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Format timestamp to locale-specific string
 */
export const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return 'Never';
  
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date to locale-specific date string
 */
export const formatDate = (timestamp: string | undefined): string => {
  if (!timestamp) return 'Never';
  
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

/**
 * Get badge color for log status
 */
export const getLogStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'success': return 'bg-green-100 text-green-800';
    case 'error': case 'failed': return 'bg-red-100 text-red-800';
    case 'pending': case 'running': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string | undefined, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format integration config for display
 */
export const formatConfig = (config: Record<string, any> | undefined): string => {
  if (!config) return 'N/A';
  
  try {
    return JSON.stringify(config, null, 2);
  } catch {
    return 'Invalid configuration';
  }
};
