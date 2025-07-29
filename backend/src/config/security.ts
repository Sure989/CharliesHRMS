/**
 * Security configuration settings
 */

import { ConfigValidator } from './validation';

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    maxAge: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  encryption: {
    saltRounds: number;
    keyLength: number;
  };
  session: {
    maxAge: number;
    cleanupInterval: number;
  };
}

/**
 * Load and validate security configuration from environment variables
 */
export function loadSecurityConfig(): SecurityConfig {
  const jwtSecret = ConfigValidator.validateString(
    'JWT_SECRET',
    process.env.JWT_SECRET,
    undefined,
    { required: true, min: 32 }
  );

  return {
    jwt: {
      secret: jwtSecret,
      expiresIn: ConfigValidator.validateString(
        'JWT_EXPIRES_IN',
        process.env.JWT_EXPIRES_IN,
        '1d',
        { required: false, pattern: /^(\d+[smhd]|\d+)$/ }
      ),
      refreshExpiresIn: ConfigValidator.validateString(
        'JWT_REFRESH_EXPIRES_IN',
        process.env.JWT_REFRESH_EXPIRES_IN,
        '7d',
        { required: false, pattern: /^(\d+[smhd]|\d+)$/ }
      ),
      algorithm: ConfigValidator.validateString(
        'JWT_ALGORITHM',
        process.env.JWT_ALGORITHM,
        'HS256',
        { required: false, enum: ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'] }
      ),
    },
    cors: {
      origin: ConfigValidator.validateArray(
        'CORS_ORIGIN',
        process.env.CORS_ORIGIN,
        ['https://charlies-hrms-frontend.vercel.app'],
        { required: false, min: 1 }
      ),
      credentials: ConfigValidator.validateBoolean(
        'CORS_CREDENTIALS',
        process.env.CORS_CREDENTIALS,
        true
      ),
      maxAge: ConfigValidator.validateNumber(
        'CORS_MAX_AGE',
        process.env.CORS_MAX_AGE,
        86400,
        { required: false, min: 0 }
      ),
    },
    rateLimit: {
      windowMs: ConfigValidator.validateNumber(
        'RATE_LIMIT_WINDOW_MS',
        process.env.RATE_LIMIT_WINDOW_MS,
        900000, // 15 minutes
        { required: false, min: 60000, max: 3600000 }
      ),
      maxRequests: ConfigValidator.validateNumber(
        'RATE_LIMIT_MAX_REQUESTS',
        process.env.RATE_LIMIT_MAX_REQUESTS,
        100,
        { required: false, min: 1, max: 10000 }
      ),
      skipSuccessfulRequests: ConfigValidator.validateBoolean(
        'RATE_LIMIT_SKIP_SUCCESSFUL',
        process.env.RATE_LIMIT_SKIP_SUCCESSFUL,
        false
      ),
    },
    encryption: {
      saltRounds: ConfigValidator.validateNumber(
        'BCRYPT_SALT_ROUNDS',
        process.env.BCRYPT_SALT_ROUNDS,
        12,
        { required: false, min: 8, max: 16 }
      ),
      keyLength: ConfigValidator.validateNumber(
        'ENCRYPTION_KEY_LENGTH',
        process.env.ENCRYPTION_KEY_LENGTH,
        32,
        { required: false, min: 16, max: 64 }
      ),
    },
    session: {
      maxAge: ConfigValidator.validateNumber(
        'SESSION_MAX_AGE',
        process.env.SESSION_MAX_AGE,
        604800000, // 7 days in milliseconds
        { required: false, min: 3600000, max: 2592000000 }
      ),
      cleanupInterval: ConfigValidator.validateNumber(
        'SESSION_CLEANUP_INTERVAL',
        process.env.SESSION_CLEANUP_INTERVAL,
        3600000, // 1 hour
        { required: false, min: 300000, max: 86400000 }
      ),
    },
  };
}