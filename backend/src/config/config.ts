/**
 * Legacy config file - now imports from the new configuration system
 * This file is kept for backward compatibility
 * @deprecated Use the new config system from './index' instead
 */

import appConfig from './index';

// Legacy interface for backward compatibility
interface LegacyConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  business: {
    defaultDepartmentName: string;
    defaultBankName: string;
    maxSalaryAdvancePercent: number;
    minEmploymentTenureMonths: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string | string[];
  };
  db: {
    url: string;
  };
}

// Map new config structure to legacy structure
const legacyConfig: LegacyConfig = {
  port: appConfig.server.port,
  nodeEnv: appConfig.server.nodeEnv,
  frontendUrl: appConfig.server.frontendUrl,
  business: {
    defaultDepartmentName: appConfig.business.defaultDepartmentName,
    defaultBankName: appConfig.business.defaultBankName,
    maxSalaryAdvancePercent: appConfig.business.maxSalaryAdvancePercent,
    minEmploymentTenureMonths: appConfig.business.minEmploymentTenureMonths,
  },
  jwt: {
    secret: appConfig.security.jwt.secret,
    expiresIn: appConfig.security.jwt.expiresIn,
    refreshExpiresIn: appConfig.security.jwt.refreshExpiresIn,
  },
  cors: {
    origin: appConfig.security.cors.origin,
  },
  db: {
    url: appConfig.database.url,
  },
};

export default legacyConfig;