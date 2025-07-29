// Environment configuration for the frontend application
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || "Charlie's HRMS",
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
  
  // Authentication
  jwtSecret: import.meta.env.VITE_JWT_SECRET,
  tokenExpiry: import.meta.env.VITE_TOKEN_EXPIRY || '24h',
  
  // Feature Flags
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  enableTestingMode: import.meta.env.VITE_ENABLE_TESTING_MODE === 'true',
  enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  
  // External Services
  emailServiceUrl: import.meta.env.VITE_EMAIL_SERVICE_URL || '',
  smsServiceUrl: import.meta.env.VITE_SMS_SERVICE_URL || '',
  fileUploadUrl: import.meta.env.VITE_FILE_UPLOAD_URL || '',
  
  // Development helpers
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// Type-safe environment validation
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_API_BASE_URL',
  ];
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
    if (config.isProduction) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  if (config.enableDebugLogs) {
    console.log('Environment configuration loaded:', {
      apiBaseUrl: config.apiBaseUrl,
      nodeEnv: config.nodeEnv,
      enableMockData: config.enableMockData,
      isDevelopment: config.isDevelopment,
    });
  }
};

// Initialize environment validation
validateEnvironment();
