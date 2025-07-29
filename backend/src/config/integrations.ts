/**
 * Integration configuration settings
 */

import { ConfigValidator } from './validation';

export interface IntegrationConfig {
  supabase: {
    url: string;
    publishableKey: string;
    secretKey: string;
    enableRealtime: boolean;
  };
  email: {
    enabled: boolean;
    provider: string;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    };
    from: string;
    replyTo: string;
  };
  banking: {
    equityBank: {
      apiKey: string;
      secretKey: string;
      endpoint: string;
      merchantCode: string;
      enabled: boolean;
    };
    mpesa: {
      apiKey: string;
      secretKey: string;
      endpoint: string;
      enabled: boolean;
    };
  };
  monitoring: {
    sentry: {
      dsn: string;
      enabled: boolean;
      environment: string;
      tracesSampleRate: number;
    };
    analytics: {
      enabled: boolean;
      provider: string;
      trackingId: string;
    };
  };
}

/**
 * Load and validate integration configuration from environment variables
 */
export function loadIntegrationConfig(): IntegrationConfig {
  return {
    supabase: {
      url: ConfigValidator.validateUrl(
        'SUPABASE_URL',
        process.env.SUPABASE_URL,
        '',
        { required: false }
      ),
      publishableKey: ConfigValidator.validateString(
        'SUPABASE_PUBLISHABLE_KEY',
        process.env.SUPABASE_PUBLISHABLE_KEY,
        '',
        { required: false }
      ),
      secretKey: ConfigValidator.validateString(
        'SUPABASE_SECRET_KEY',
        process.env.SUPABASE_SECRET_KEY,
        '',
        { required: false }
      ),
      enableRealtime: ConfigValidator.validateBoolean(
        'SUPABASE_ENABLE_REALTIME',
        process.env.SUPABASE_ENABLE_REALTIME,
        false
      ),
    },
    email: {
      enabled: ConfigValidator.validateBoolean(
        'EMAIL_ENABLED',
        process.env.EMAIL_ENABLED,
        false
      ),
      provider: ConfigValidator.validateString(
        'EMAIL_PROVIDER',
        process.env.EMAIL_PROVIDER,
        'smtp',
        { required: false, enum: ['smtp', 'sendgrid', 'mailgun', 'ses'] }
      ),
      smtp: {
        host: ConfigValidator.validateString(
          'SMTP_HOST',
          process.env.SMTP_HOST,
          '',
          { required: false }
        ),
        port: ConfigValidator.validateNumber(
          'SMTP_PORT',
          process.env.SMTP_PORT,
          587,
          { required: false, min: 1, max: 65535 }
        ),
        secure: ConfigValidator.validateBoolean(
          'SMTP_SECURE',
          process.env.SMTP_SECURE,
          false
        ),
        user: ConfigValidator.validateString(
          'SMTP_USER',
          process.env.SMTP_USER,
          '',
          { required: false }
        ),
        password: ConfigValidator.validateString(
          'SMTP_PASSWORD',
          process.env.SMTP_PASSWORD,
          '',
          { required: false }
        ),
      },
      from: ConfigValidator.validateString(
        'EMAIL_FROM',
        process.env.EMAIL_FROM,
        'noreply@charlieshrms.com',
        { required: false }
      ),
      replyTo: ConfigValidator.validateString(
        'EMAIL_REPLY_TO',
        process.env.EMAIL_REPLY_TO,
        'support@charlieshrms.com',
        { required: false }
      ),
    },
    banking: {
      equityBank: {
        apiKey: ConfigValidator.validateString(
          'EQUITY_BANK_API_KEY',
          process.env.EQUITY_BANK_API_KEY,
          'EQB_API_KEY_PLACEHOLDER',
          { required: false }
        ),
        secretKey: ConfigValidator.validateString(
          'EQUITY_BANK_SECRET',
          process.env.EQUITY_BANK_SECRET,
          'EQB_SECRET_PLACEHOLDER',
          { required: false }
        ),
        endpoint: ConfigValidator.validateUrl(
          'EQUITY_BANK_ENDPOINT',
          process.env.EQUITY_BANK_ENDPOINT,
          'https://api.equitybank.co.ke/v1',
          { required: false }
        ),
        merchantCode: ConfigValidator.validateString(
          'EQUITY_BANK_MERCHANT_CODE',
          process.env.EQUITY_BANK_MERCHANT_CODE,
          'CORP001',
          { required: false }
        ),
        enabled: ConfigValidator.validateBoolean(
          'EQUITY_BANK_ENABLED',
          process.env.EQUITY_BANK_ENABLED,
          false
        ),
      },
      mpesa: {
        apiKey: ConfigValidator.validateString(
          'MPESA_API_KEY',
          process.env.MPESA_API_KEY,
          'MPESA_API_KEY_PLACEHOLDER',
          { required: false }
        ),
        secretKey: ConfigValidator.validateString(
          'MPESA_SECRET',
          process.env.MPESA_SECRET,
          'MPESA_SECRET_PLACEHOLDER',
          { required: false }
        ),
        endpoint: ConfigValidator.validateUrl(
          'MPESA_ENDPOINT',
          process.env.MPESA_ENDPOINT,
          'https://api.safaricom.co.ke/mpesa',
          { required: false }
        ),
        enabled: ConfigValidator.validateBoolean(
          'MPESA_ENABLED',
          process.env.MPESA_ENABLED,
          false
        ),
      },
    },
    monitoring: {
      sentry: {
        dsn: ConfigValidator.validateString(
          'SENTRY_DSN',
          process.env.SENTRY_DSN,
          '',
          { required: false }
        ),
        enabled: ConfigValidator.validateBoolean(
          'SENTRY_ENABLED',
          process.env.SENTRY_ENABLED,
          false
        ),
        environment: ConfigValidator.validateString(
          'SENTRY_ENVIRONMENT',
          process.env.SENTRY_ENVIRONMENT,
          process.env.NODE_ENV || 'development',
          { required: false }
        ),
        tracesSampleRate: ConfigValidator.validateNumber(
          'SENTRY_TRACES_SAMPLE_RATE',
          process.env.SENTRY_TRACES_SAMPLE_RATE,
          0.1,
          { required: false, min: 0, max: 1 }
        ),
      },
      analytics: {
        enabled: ConfigValidator.validateBoolean(
          'ANALYTICS_ENABLED',
          process.env.ANALYTICS_ENABLED,
          false
        ),
        provider: ConfigValidator.validateString(
          'ANALYTICS_PROVIDER',
          process.env.ANALYTICS_PROVIDER,
          'google',
          { required: false, enum: ['google', 'mixpanel', 'amplitude'] }
        ),
        trackingId: ConfigValidator.validateString(
          'ANALYTICS_TRACKING_ID',
          process.env.ANALYTICS_TRACKING_ID,
          '',
          { required: false }
        ),
      },
    },
  };
}