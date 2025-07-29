/**
 * Database configuration settings
 */

import { ConfigValidator } from './validation';

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

/**
 * Load and validate database configuration from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const databaseUrl = ConfigValidator.validateString(
    'DATABASE_URL',
    process.env.DATABASE_URL,
    undefined,
    { required: true, min: 10 }
  );

  // Validate DATABASE_URL format for PostgreSQL
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.warn('Warning: DATABASE_URL should start with postgresql:// or postgres:// for PostgreSQL databases');
  }

  return {
    url: databaseUrl,
    maxConnections: ConfigValidator.validateNumber(
      'DB_MAX_CONNECTIONS',
      process.env.DB_MAX_CONNECTIONS,
      10,
      { required: false, min: 1, max: 100 }
    ),
    connectionTimeout: ConfigValidator.validateNumber(
      'DB_CONNECTION_TIMEOUT',
      process.env.DB_CONNECTION_TIMEOUT,
      30000,
      { required: false, min: 1000, max: 120000 }
    ),
    queryTimeout: ConfigValidator.validateNumber(
      'DB_QUERY_TIMEOUT',
      process.env.DB_QUERY_TIMEOUT,
      10000,
      { required: false, min: 1000, max: 60000 }
    ),
    enableLogging: ConfigValidator.validateBoolean(
      'DB_ENABLE_LOGGING',
      process.env.DB_ENABLE_LOGGING,
      process.env.NODE_ENV === 'development'
    ),
    enableMetrics: ConfigValidator.validateBoolean(
      'DB_ENABLE_METRICS',
      process.env.DB_ENABLE_METRICS,
      false
    ),
  };
}