/**
 * Main configuration module
 * Consolidates all configuration settings with validation and type safety
 */

import dotenv from 'dotenv';
import path from 'path';
import { BusinessConfig, loadBusinessConfig } from './business';
import { DatabaseConfig, loadDatabaseConfig } from './database';
import { SecurityConfig, loadSecurityConfig } from './security';
import { ServerConfig, loadServerConfig } from './server';
import { IntegrationConfig, loadIntegrationConfig } from './integrations';
import { ConfigValidationError } from './validation';
import { developmentConfig } from './environments/development';
import { productionConfig } from './environments/production';
import { testConfig } from './environments/test';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  business: BusinessConfig;
  integrations: IntegrationConfig;
  
  // Computed properties
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  
  // Metadata
  version: string;
  buildTime: string;
  configLoadTime: string;
}

/**
 * Load and validate all configuration settings
 */
function loadAppConfig(): AppConfig {
  const startTime = Date.now();
  
  try {
    console.log('🔧 Loading application configuration...');
    
    // Load all configuration modules
    const server = loadServerConfig();
    const database = loadDatabaseConfig();
    const security = loadSecurityConfig();
    const business = loadBusinessConfig();
    const integrations = loadIntegrationConfig();
    
    // Validate cross-module dependencies
    validateCrossModuleDependencies(server, security, business);
    
    const config: AppConfig = {
      server,
      database,
      security,
      business,
      integrations,
      
      // Computed properties
      isProduction: server.nodeEnv === 'production',
      isDevelopment: server.nodeEnv === 'development',
      isTest: server.nodeEnv === 'test',
      
      // Metadata
      version: process.env.npm_package_version || '1.0.0',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      configLoadTime: new Date().toISOString(),
    };
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Configuration loaded successfully in ${loadTime}ms`);
    
    // Log configuration summary (without sensitive data)
    logConfigurationSummary(config);
    
    return config;
    
  } catch (error) {
    console.error('❌ Configuration loading failed:', error);
    
    if (error instanceof ConfigValidationError) {
      console.error('Configuration validation error:', error.message);
      process.exit(1);
    }
    
    throw error;
  }
}

/**
 * Validate dependencies between configuration modules
 */
function validateCrossModuleDependencies(
  server: ServerConfig,
  security: SecurityConfig,
  business: BusinessConfig
): void {
  // Validate CORS origins include frontend URL
  if (!security.cors.origin.includes(server.frontendUrl)) {
    console.warn(`⚠️  Frontend URL (${server.frontendUrl}) not included in CORS origins`);
  }
  
  // Validate production settings
  if (server.nodeEnv === 'production') {
    if (business.mockLoginEnabled) {
      throw new ConfigValidationError('MOCK_LOGIN_ENABLED', 'must be false in production');
    }
    
    if (business.demoModeEnabled) {
      console.warn('⚠️  Demo mode is enabled in production');
    }
    
    if (security.jwt.secret.length < 64) {
      console.warn('⚠️  JWT secret should be at least 64 characters in production');
    }
  }
  
  // Validate development settings
  if (server.nodeEnv === 'development') {
    if (!business.mockLoginEnabled) {
      console.log('ℹ️  Mock login is disabled in development');
    }
  }
}

/**
 * Log configuration summary without sensitive information
 */
function logConfigurationSummary(config: AppConfig): void {
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${config.server.nodeEnv}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   Frontend URL: ${config.server.frontendUrl}`);
  console.log(`   Database: ${config.database.url.split('@')[1] || 'configured'}`);
  console.log(`   CORS Origins: ${config.security.cors.origin.length} configured`);
  console.log(`   Default Department: ${config.business.defaultDepartmentName}`);
  console.log(`   HR Role: ${config.business.hrRole}`);
  console.log(`   Max Salary Advance: ${config.business.maxSalaryAdvancePercent}%`);
  console.log(`   Mock Login: ${config.business.mockLoginEnabled ? 'enabled' : 'disabled'}`);
  console.log(`   Demo Mode: ${config.business.demoModeEnabled ? 'enabled' : 'disabled'}`);
  
  // Log enabled integrations
  const enabledIntegrations = [];
  if (config.integrations.email.enabled) enabledIntegrations.push('Email');
  if (config.integrations.banking.equityBank.enabled) enabledIntegrations.push('Equity Bank');
  if (config.integrations.banking.mpesa.enabled) enabledIntegrations.push('M-Pesa');
  if (config.integrations.monitoring.sentry.enabled) enabledIntegrations.push('Sentry');
  if (config.integrations.monitoring.analytics.enabled) enabledIntegrations.push('Analytics');
  
  console.log(`   Integrations: ${enabledIntegrations.length > 0 ? enabledIntegrations.join(', ') : 'none'}`);
}

/**
 * Get configuration for a specific module
 */
export function getBusinessConfig(): BusinessConfig {
  return config.business;
}

export function getDatabaseConfig(): DatabaseConfig {
  return config.database;
}

export function getSecurityConfig(): SecurityConfig {
  return config.security;
}

export function getServerConfig(): ServerConfig {
  return config.server;
}

export function getIntegrationConfig(): IntegrationConfig {
  return config.integrations;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  switch (feature) {
    case 'mockLogin':
      return config.business.mockLoginEnabled;
    case 'demoMode':
      return config.business.demoModeEnabled;
    case 'email':
      return config.integrations.email.enabled;
    case 'sentry':
      return config.integrations.monitoring.sentry.enabled;
    case 'analytics':
      return config.integrations.monitoring.analytics.enabled;
    default:
      return false;
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
    isTest: config.isTest,
    nodeEnv: config.server.nodeEnv,
  };
}

// Load configuration on module import
const config = loadAppConfig();

// Export the main configuration object
export default config;

// Export individual configuration modules
export {
  BusinessConfig,
  DatabaseConfig,
  SecurityConfig,
  ServerConfig,
  IntegrationConfig,
  ConfigValidationError,
};