/**
 * Production environment configuration
 */

export const productionConfig = {
  // Production-specific overrides
  business: {
    mockLoginEnabled: false, // Must be disabled in production
    demoModeEnabled: false, // Must be disabled in production
    defaultDepartmentName: 'General',
    hrRole: 'HR',
    maxSalaryAdvancePercent: 50, // Standard limit
    minEmploymentTenureMonths: 6, // Standard requirement
  },
  
  security: {
    jwt: {
      expiresIn: '8h', // Shorter sessions for security
      refreshExpiresIn: '7d',
    },
    cors: {
      origin: ['https://charlies-hrms-frontend.vercel.app'], // Only production frontend
      credentials: true,
    },
    rateLimit: {
      maxRequests: 100, // Stricter limits for production
      windowMs: 900000, // 15 minutes
    },
    encryption: {
      saltRounds: 14, // Higher security in production
    },
  },
  
  database: {
    enableLogging: false, // Disable verbose logging in production
    enableMetrics: true,
    maxConnections: 20, // Higher for production load
    connectionTimeout: 10000, // Shorter timeout
  },
  
  integrations: {
    email: {
      enabled: true, // Enable emails in production
    },
    monitoring: {
      sentry: {
        enabled: true, // Enable error tracking in production
        tracesSampleRate: 0.1, // Sample 10% of transactions
      },
      analytics: {
        enabled: true, // Enable analytics in production
      },
    },
  },
};