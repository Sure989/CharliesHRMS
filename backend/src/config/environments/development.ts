/**
 * Development environment configuration
 */

export const developmentConfig = {
  // Development-specific overrides
  business: {
    mockLoginEnabled: true,
    demoModeEnabled: true,
    defaultDepartmentName: 'Development',
    hrRole: 'HR_MANAGER',
    maxSalaryAdvancePercent: 75, // Higher limit for testing
    minEmploymentTenureMonths: 3, // Lower requirement for testing
  },
  
  security: {
    jwt: {
      expiresIn: '24h', // Longer sessions for development
      refreshExpiresIn: '30d',
    },
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
      credentials: true,
    },
    rateLimit: {
      maxRequests: 1000, // Higher limits for development
      windowMs: 900000, // 15 minutes
    },
  },
  
  database: {
    enableLogging: true,
    enableMetrics: true,
    maxConnections: 5, // Lower for development
  },
  
  integrations: {
    email: {
      enabled: false, // Disable emails in development
    },
    monitoring: {
      sentry: {
        enabled: false, // Disable error tracking in development
      },
      analytics: {
        enabled: false, // Disable analytics in development
      },
    },
  },
};