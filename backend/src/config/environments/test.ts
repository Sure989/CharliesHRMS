/**
 * Test environment configuration
 */

export const testConfig = {
  // Test-specific overrides
  business: {
    mockLoginEnabled: true,
    demoModeEnabled: true,
    defaultDepartmentName: 'Test Department',
    hrRole: 'TEST_HR',
    maxSalaryAdvancePercent: 100, // No limits for testing
    minEmploymentTenureMonths: 0, // No requirements for testing
    defaultCurrentSalary: 50000,
    defaultExistingAdvances: 0,
  },
  
  security: {
    jwt: {
      secret: 'test-jwt-secret-for-testing-only-not-secure',
      expiresIn: '1h',
      refreshExpiresIn: '24h',
    },
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    },
    rateLimit: {
      maxRequests: 10000, // No limits for testing
      windowMs: 60000, // 1 minute
    },
    encryption: {
      saltRounds: 8, // Faster for testing
    },
  },
  
  database: {
    enableLogging: false, // Reduce noise in tests
    enableMetrics: false,
    maxConnections: 2, // Minimal for testing
    connectionTimeout: 5000,
    queryTimeout: 3000,
  },
  
  integrations: {
    email: {
      enabled: false, // Never send emails in tests
    },
    banking: {
      equityBank: {
        enabled: false, // Use mock services in tests
      },
      mpesa: {
        enabled: false, // Use mock services in tests
      },
    },
    monitoring: {
      sentry: {
        enabled: false, // No error tracking in tests
      },
      analytics: {
        enabled: false, // No analytics in tests
      },
    },
  },
};