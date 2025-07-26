/**
 * Feature Flags System
 * 
 * This module provides a centralized way to manage feature flags for the application.
 * It allows enabling/disabling experimental features and controlling feature rollouts.
 */

// Default feature flag values
const defaultFlags = {
  // Legacy API flags (all set to true as migration is complete)
  useApiForUsers: true,
  useApiForEmployees: true,
  useApiForDepartments: true,
  useApiForBranches: true,
  useApiForRoles: true,
  useApiForPermissions: true,
  useApiForPayroll: true,
  useApiForLeave: true,
  useApiForSalaryAdvance: true,
  useApiForAnalytics: true,
  
  // Legacy Component flags
  useApiInUserManagement: true,
  useApiInAdminDashboard: true,
  useApiInSecurityManagement: true,
  useApiInWorkflowDashboard: true,
  useApiInPerformanceManagement: true,
  useApiInTrainingManagement: true,
  useApiInSalaryAdvanceManagement: true,
  useApiInOperationsDashboard: true,
  useApiInTeamsOverview: true,
  useApiInPayrollDashboard: true,
  
  // Legacy Service flags
  useApiInPayrollDataService: true,
  
  // New Experimental Features
  enableAdvancedAnalytics: false,
  enableMultiCurrencySupport: false,
  enableKenyanPayrollRules: true,
  enableWorkflowAutomation: true,
  enableAuditTrails: true,
  
  // UI Features
  enableDarkMode: false,
  enableDataExports: true,
  enableBulkOperations: false,
  enableNotifications: true,
  enableRealTimeUpdates: true,
  
  // Performance Features
  enableCaching: true,
  enableDataPrefetching: false,
  enableLazyLoading: true,
  
  // Compliance Features
  enableGDPRCompliance: true,
  enableDataRetentionPolicies: false,
  enableAuditLogging: true,
  
  // Administrative Features
  enableUserImpersonation: false,
  enableBatchProcessing: true,
  enableScheduledReports: false,
  enableAdvancedPermissions: false,
};

// Get flags from localStorage if available
const loadFlags = (): typeof defaultFlags => {
  try {
    const storedFlags = localStorage.getItem('featureFlags');
    if (storedFlags) {
      return { ...defaultFlags, ...JSON.parse(storedFlags) };
    }
  } catch (error) {
    console.error('Error loading feature flags from localStorage:', error);
  }
  return defaultFlags;
};

// Save flags to localStorage
const saveFlags = (flags: typeof defaultFlags): void => {
  try {
    localStorage.setItem('featureFlags', JSON.stringify(flags));
  } catch (error) {
    console.error('Error saving feature flags to localStorage:', error);
  }
};

// Initialize flags
let featureFlags = loadFlags();

/**
 * Get the current value of a feature flag
 * @param flag The name of the flag to get
 * @returns The current value of the flag
 */
export const getFlag = <K extends keyof typeof featureFlags>(flag: K): typeof featureFlags[K] => {
  return featureFlags[flag];
};

/**
 * Set the value of a feature flag
 * @param flag The name of the flag to set
 * @param value The new value for the flag
 */
export const setFlag = <K extends keyof typeof featureFlags>(flag: K, value: typeof featureFlags[K]): void => {
  featureFlags = { ...featureFlags, [flag]: value };
  saveFlags(featureFlags);
};

/**
 * Toggle the value of a feature flag
 * @param flag The name of the flag to toggle
 * @returns The new value of the flag
 */
export const toggleFlag = <K extends keyof typeof featureFlags>(flag: K): typeof featureFlags[K] => {
  const newValue = !featureFlags[flag];
  setFlag(flag, newValue);
  return newValue;
};

/**
 * Reset all feature flags to their default values
 */
export const resetFlags = (): void => {
  featureFlags = { ...defaultFlags };
  saveFlags(featureFlags);
};

/**
 * Get all feature flags
 * @returns All feature flags
 */
export const getAllFlags = (): typeof featureFlags => {
  return { ...featureFlags };
};

/**
 * Set multiple feature flags at once
 * @param flags Object containing flag names and values to set
 */
export const setFlags = (flags: Partial<typeof featureFlags>): void => {
  featureFlags = { ...featureFlags, ...flags };
  saveFlags(featureFlags);
};

/**
 * Enable all API data sources
 */
export const enableAllApiDataSources = (): void => {
  setFlags({
    useApiForUsers: true,
    useApiForEmployees: true,
    useApiForDepartments: true,
    useApiForBranches: true,
    useApiForRoles: true,
    useApiForPermissions: true,
    useApiForPayroll: true,
    useApiForLeave: true,
    useApiForSalaryAdvance: true,
    useApiForAnalytics: true,
  });
};

/**
 * Disable all API data sources (use mock data)
 */
export const disableAllApiDataSources = (): void => {
  setFlags({
    useApiForUsers: false,
    useApiForEmployees: false,
    useApiForDepartments: false,
    useApiForBranches: false,
    useApiForRoles: false,
    useApiForPermissions: false,
    useApiForPayroll: false,
    useApiForLeave: false,
    useApiForSalaryAdvance: false,
    useApiForAnalytics: false,
  });
};

/**
 * Enable all experimental features
 */
export const enableAllExperimentalFeatures = (): void => {
  setFlags({
    enableAdvancedAnalytics: true,
    enableMultiCurrencySupport: true,
    enableKenyanPayrollRules: true,
    enableWorkflowAutomation: true,
    enableAuditTrails: true
  });
};

/**
 * Disable all experimental features
 */
export const disableAllExperimentalFeatures = (): void => {
  setFlags({
    enableAdvancedAnalytics: false,
    enableMultiCurrencySupport: false,
    enableKenyanPayrollRules: false,
    enableWorkflowAutomation: false,
    enableAuditTrails: false
  });
};

/**
 * Enable all UI features
 */
export const enableAllUIFeatures = (): void => {
  setFlags({
    enableDarkMode: true,
    enableDataExports: true,
    enableBulkOperations: true,
    enableNotifications: true,
    enableRealTimeUpdates: true
  });
};

/**
 * Disable all UI features
 */
export const disableAllUIFeatures = (): void => {
  setFlags({
    enableDarkMode: false,
    enableDataExports: false,
    enableBulkOperations: false,
    enableNotifications: false,
    enableRealTimeUpdates: false
  });
};

/**
 * Enable all performance features
 */
export const enableAllPerformanceFeatures = (): void => {
  setFlags({
    enableCaching: true,
    enableDataPrefetching: true,
    enableLazyLoading: true
  });
};

/**
 * Disable all performance features
 */
export const disableAllPerformanceFeatures = (): void => {
  setFlags({
    enableCaching: false,
    enableDataPrefetching: false,
    enableLazyLoading: false
  });
};

/**
 * Enable all compliance features
 */
export const enableAllComplianceFeatures = (): void => {
  setFlags({
    enableGDPRCompliance: true,
    enableDataRetentionPolicies: true,
    enableAuditLogging: true
  });
};

/**
 * Disable all compliance features
 */
export const disableAllComplianceFeatures = (): void => {
  setFlags({
    enableGDPRCompliance: false,
    enableDataRetentionPolicies: false,
    enableAuditLogging: false
  });
};

/**
 * Enable all admin features
 */
export const enableAllAdminFeatures = (): void => {
  setFlags({
    enableUserImpersonation: true,
    enableBatchProcessing: true,
    enableScheduledReports: true,
    enableAdvancedPermissions: true
  });
};

/**
 * Disable all admin features
 */
export const disableAllAdminFeatures = (): void => {
  setFlags({
    enableUserImpersonation: false,
    enableBatchProcessing: false,
    enableScheduledReports: false,
    enableAdvancedPermissions: false
  });
};

/**
 * Enable all legacy API features (should remain enabled)
 */
export const enableAllLegacyFeatures = (): void => {
  setFlags({
    useApiForUsers: true,
    useApiForEmployees: true,
    useApiForDepartments: true,
    useApiForBranches: true,
    useApiForRoles: true,
    useApiForPermissions: true,
    useApiForPayroll: true,
    useApiForLeave: true,
    useApiForSalaryAdvance: true,
    useApiForAnalytics: true,
    useApiInUserManagement: true,
    useApiInAdminDashboard: true,
    useApiInSecurityManagement: true,
    useApiInWorkflowDashboard: true,
    useApiInPerformanceManagement: true,
    useApiInTrainingManagement: true,
    useApiInSalaryAdvanceManagement: true,
    useApiInOperationsDashboard: true,
    useApiInTeamsOverview: true,
    useApiInPayrollDashboard: true,
    useApiInPayrollDataService: true
  });
};

// Export default flags for reference
export const DEFAULT_FLAGS = { ...defaultFlags };

// Export the feature flags object for direct access
export default featureFlags;
