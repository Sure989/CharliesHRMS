/**
 * Configuration system tests
 */

import { ConfigValidator, ConfigValidationError } from './validation';
import { loadBusinessConfig } from './business';
import { loadSecurityConfig } from './security';
import { loadServerConfig } from './server';

describe('Configuration System', () => {
  describe('ConfigValidator', () => {
    test('validateString should work correctly', () => {
      // Valid string
      expect(ConfigValidator.validateString('TEST_KEY', 'test-value')).toBe('test-value');
      
      // Default value
      expect(ConfigValidator.validateString('TEST_KEY', undefined, 'default')).toBe('default');
      
      // Required validation
      expect(() => {
        ConfigValidator.validateString('TEST_KEY', undefined, undefined, { required: true });
      }).toThrow(ConfigValidationError);
      
      // Length validation
      expect(() => {
        ConfigValidator.validateString('TEST_KEY', 'ab', undefined, { min: 5 });
      }).toThrow(ConfigValidationError);
      
      // Pattern validation
      expect(() => {
        ConfigValidator.validateString('TEST_KEY', 'invalid', undefined, { pattern: /^[0-9]+$/ });
      }).toThrow(ConfigValidationError);
      
      // Enum validation
      expect(() => {
        ConfigValidator.validateString('TEST_KEY', 'invalid', undefined, { enum: ['valid1', 'valid2'] });
      }).toThrow(ConfigValidationError);
    });

    test('validateNumber should work correctly', () => {
      // Valid number
      expect(ConfigValidator.validateNumber('TEST_KEY', '123')).toBe(123);
      expect(ConfigValidator.validateNumber('TEST_KEY', 456)).toBe(456);
      
      // Default value
      expect(ConfigValidator.validateNumber('TEST_KEY', undefined, 789)).toBe(789);
      
      // Required validation
      expect(() => {
        ConfigValidator.validateNumber('TEST_KEY', undefined, undefined, { required: true });
      }).toThrow(ConfigValidationError);
      
      // Range validation
      expect(() => {
        ConfigValidator.validateNumber('TEST_KEY', '5', undefined, { min: 10 });
      }).toThrow(ConfigValidationError);
      
      expect(() => {
        ConfigValidator.validateNumber('TEST_KEY', '15', undefined, { max: 10 });
      }).toThrow(ConfigValidationError);
      
      // Invalid number
      expect(() => {
        ConfigValidator.validateNumber('TEST_KEY', 'not-a-number');
      }).toThrow(ConfigValidationError);
    });

    test('validateBoolean should work correctly', () => {
      // Valid boolean values
      expect(ConfigValidator.validateBoolean('TEST_KEY', true)).toBe(true);
      expect(ConfigValidator.validateBoolean('TEST_KEY', false)).toBe(false);
      expect(ConfigValidator.validateBoolean('TEST_KEY', 'true')).toBe(true);
      expect(ConfigValidator.validateBoolean('TEST_KEY', 'false')).toBe(false);
      expect(ConfigValidator.validateBoolean('TEST_KEY', '1')).toBe(true);
      expect(ConfigValidator.validateBoolean('TEST_KEY', '0')).toBe(false);
      expect(ConfigValidator.validateBoolean('TEST_KEY', 'yes')).toBe(true);
      expect(ConfigValidator.validateBoolean('TEST_KEY', 'no')).toBe(false);
      
      // Default value
      expect(ConfigValidator.validateBoolean('TEST_KEY', undefined, true)).toBe(true);
      
      // Invalid boolean
      expect(() => {
        ConfigValidator.validateBoolean('TEST_KEY', 'invalid');
      }).toThrow(ConfigValidationError);
    });

    test('validateArray should work correctly', () => {
      // Valid array
      expect(ConfigValidator.validateArray('TEST_KEY', 'a,b,c')).toEqual(['a', 'b', 'c']);
      expect(ConfigValidator.validateArray('TEST_KEY', ['x', 'y', 'z'])).toEqual(['x', 'y', 'z']);
      
      // Default value
      expect(ConfigValidator.validateArray('TEST_KEY', undefined, ['default'])).toEqual(['default']);
      
      // Required validation
      expect(() => {
        ConfigValidator.validateArray('TEST_KEY', undefined, undefined, { required: true });
      }).toThrow(ConfigValidationError);
      
      // Length validation
      expect(() => {
        ConfigValidator.validateArray('TEST_KEY', 'a', undefined, { min: 2 });
      }).toThrow(ConfigValidationError);
    });

    test('validateUrl should work correctly', () => {
      // Valid URLs
      expect(ConfigValidator.validateUrl('TEST_KEY', 'https://example.com')).toBe('https://example.com');
      expect(ConfigValidator.validateUrl('TEST_KEY', 'http://localhost:3000')).toBe('http://localhost:3000');
      
      // Invalid URL
      expect(() => {
        ConfigValidator.validateUrl('TEST_KEY', 'not-a-url');
      }).toThrow(ConfigValidationError);
      
      // Required validation
      expect(() => {
        ConfigValidator.validateUrl('TEST_KEY', undefined, undefined, { required: true });
      }).toThrow(ConfigValidationError);
    });
  });

  describe('Business Configuration', () => {
    test('should load with valid environment variables', () => {
      // Set test environment variables
      process.env.DEFAULT_DEPARTMENT_NAME = 'Test Department';
      process.env.HR_ROLE = 'HR_MANAGER';
      process.env.MAX_SALARY_ADVANCE_PERCENT = '60';
      process.env.MIN_EMPLOYMENT_TENURE_MONTHS = '3';
      
      const config = loadBusinessConfig();
      
      expect(config.defaultDepartmentName).toBe('Test Department');
      expect(config.hrRole).toBe('HR_MANAGER');
      expect(config.maxSalaryAdvancePercent).toBe(60);
      expect(config.minEmploymentTenureMonths).toBe(3);
      
      // Clean up
      delete process.env.DEFAULT_DEPARTMENT_NAME;
      delete process.env.HR_ROLE;
      delete process.env.MAX_SALARY_ADVANCE_PERCENT;
      delete process.env.MIN_EMPLOYMENT_TENURE_MONTHS;
    });

    test('should use defaults when environment variables are not set', () => {
      const config = loadBusinessConfig();
      
      expect(config.defaultDepartmentName).toBe('General');
      expect(config.hrRole).toBe('HR');
      expect(config.maxSalaryAdvancePercent).toBe(50);
      expect(config.minEmploymentTenureMonths).toBe(6);
    });

    test('should validate enum values', () => {
      process.env.HR_ROLE = 'INVALID_ROLE';
      
      expect(() => {
        loadBusinessConfig();
      }).toThrow(ConfigValidationError);
      
      delete process.env.HR_ROLE;
    });

    test('should validate number ranges', () => {
      process.env.MAX_SALARY_ADVANCE_PERCENT = '150'; // Invalid: > 100
      
      expect(() => {
        loadBusinessConfig();
      }).toThrow(ConfigValidationError);
      
      delete process.env.MAX_SALARY_ADVANCE_PERCENT;
    });
  });

  describe('Security Configuration', () => {
    test('should require JWT_SECRET', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        loadSecurityConfig();
      }).toThrow(ConfigValidationError);
      
      process.env.JWT_SECRET = originalSecret;
    });

    test('should validate JWT_SECRET length', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'too-short'; // Less than 32 characters
      
      expect(() => {
        loadSecurityConfig();
      }).toThrow(ConfigValidationError);
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Server Configuration', () => {
    test('should require FRONTEND_URL', () => {
      const originalUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;
      
      expect(() => {
        loadServerConfig();
      }).toThrow(ConfigValidationError);
      
      process.env.FRONTEND_URL = originalUrl;
    });

    test('should validate FRONTEND_URL format', () => {
      const originalUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'not-a-url';
      
      expect(() => {
        loadServerConfig();
      }).toThrow(ConfigValidationError);
      
      process.env.FRONTEND_URL = originalUrl;
    });

    test('should validate NODE_ENV enum', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'invalid-environment';
      
      expect(() => {
        loadServerConfig();
      }).toThrow(ConfigValidationError);
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

// Mock console methods for testing
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});