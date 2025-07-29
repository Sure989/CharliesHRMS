/**
 * Server configuration settings
 */

import { ConfigValidator } from './validation';

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  apiPrefix: string;
  enableHttps: boolean;
  trustProxy: boolean;
  requestTimeout: number;
  bodyLimit: string;
  enableCompression: boolean;
  enableHelmet: boolean;
}

/**
 * Load and validate server configuration from environment variables
 */
export function loadServerConfig(): ServerConfig {
  return {
    port: ConfigValidator.validateNumber(
      'PORT',
      process.env.PORT,
      5000,
      { required: false, min: 1000, max: 65535 }
    ),
    nodeEnv: ConfigValidator.validateString(
      'NODE_ENV',
      process.env.NODE_ENV,
      'development',
      { required: false, enum: ['development', 'production', 'test', 'staging'] }
    ),
    frontendUrl: ConfigValidator.validateUrl(
      'FRONTEND_URL',
      process.env.FRONTEND_URL,
      undefined,
      { required: true }
    ),
    apiPrefix: ConfigValidator.validateString(
      'API_PREFIX',
      process.env.API_PREFIX,
      '/api',
      { required: false, pattern: /^\/.*/ }
    ),
    enableHttps: ConfigValidator.validateBoolean(
      'ENABLE_HTTPS',
      process.env.ENABLE_HTTPS,
      process.env.NODE_ENV === 'production'
    ),
    trustProxy: ConfigValidator.validateBoolean(
      'TRUST_PROXY',
      process.env.TRUST_PROXY,
      process.env.NODE_ENV === 'production'
    ),
    requestTimeout: ConfigValidator.validateNumber(
      'REQUEST_TIMEOUT',
      process.env.REQUEST_TIMEOUT,
      30000,
      { required: false, min: 5000, max: 300000 }
    ),
    bodyLimit: ConfigValidator.validateString(
      'BODY_LIMIT',
      process.env.BODY_LIMIT,
      '10mb',
      { required: false, pattern: /^\d+[kmg]?b$/i }
    ),
    enableCompression: ConfigValidator.validateBoolean(
      'ENABLE_COMPRESSION',
      process.env.ENABLE_COMPRESSION,
      true
    ),
    enableHelmet: ConfigValidator.validateBoolean(
      'ENABLE_HELMET',
      process.env.ENABLE_HELMET,
      process.env.NODE_ENV === 'production'
    ),
  };
}