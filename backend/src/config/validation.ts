/**
 * Configuration validation utilities
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
}

export class ConfigValidationError extends Error {
  constructor(key: string, message: string) {
    super(`Configuration error for ${key}: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigValidator {
  /**
   * Validate a string configuration value
   */
  static validateString(
    key: string,
    value: string | undefined,
    defaultValue?: string,
    rules: ValidationRule = {}
  ): string {
    const finalValue = value || defaultValue;
    
    if (rules.required && !finalValue) {
      throw new ConfigValidationError(key, 'is required but not provided');
    }
    
    if (!finalValue) {
      return '';
    }
    
    if (rules.min && finalValue.length < rules.min) {
      throw new ConfigValidationError(key, `must be at least ${rules.min} characters long`);
    }
    
    if (rules.max && finalValue.length > rules.max) {
      throw new ConfigValidationError(key, `must be no more than ${rules.max} characters long`);
    }
    
    if (rules.pattern && !rules.pattern.test(finalValue)) {
      throw new ConfigValidationError(key, `does not match required pattern`);
    }
    
    if (rules.enum && !rules.enum.includes(finalValue)) {
      throw new ConfigValidationError(key, `must be one of: ${rules.enum.join(', ')}`);
    }
    
    return finalValue;
  }

  /**
   * Validate a number configuration value
   */
  static validateNumber(
    key: string,
    value: string | number | undefined,
    defaultValue?: number,
    rules: ValidationRule = {}
  ): number {
    let numValue: number;
    
    if (value === undefined || value === '') {
      if (rules.required) {
        throw new ConfigValidationError(key, 'is required but not provided');
      }
      numValue = defaultValue || 0;
    } else {
      numValue = typeof value === 'string' ? parseInt(value, 10) : value;
      
      if (isNaN(numValue)) {
        throw new ConfigValidationError(key, 'must be a valid number');
      }
    }
    
    if (rules.min !== undefined && numValue < rules.min) {
      throw new ConfigValidationError(key, `must be at least ${rules.min}`);
    }
    
    if (rules.max !== undefined && numValue > rules.max) {
      throw new ConfigValidationError(key, `must be no more than ${rules.max}`);
    }
    
    return numValue;
  }

  /**
   * Validate a boolean configuration value
   */
  static validateBoolean(
    key: string,
    value: string | boolean | undefined,
    defaultValue?: boolean
  ): boolean {
    if (value === undefined || value === '') {
      return defaultValue || false;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    const stringValue = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(stringValue)) {
      return true;
    }
    
    if (['false', '0', 'no', 'off'].includes(stringValue)) {
      return false;
    }
    
    throw new ConfigValidationError(key, 'must be a valid boolean value (true/false, 1/0, yes/no, on/off)');
  }

  /**
   * Validate an array configuration value (comma-separated string)
   */
  static validateArray(
    key: string,
    value: string | string[] | undefined,
    defaultValue?: string[],
    rules: ValidationRule = {}
  ): string[] {
    let arrayValue: string[];
    
    if (value === undefined || value === '') {
      if (rules.required) {
        throw new ConfigValidationError(key, 'is required but not provided');
      }
      arrayValue = defaultValue || [];
    } else if (typeof value === 'string') {
      arrayValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
      arrayValue = value;
    }
    
    if (rules.min !== undefined && arrayValue.length < rules.min) {
      throw new ConfigValidationError(key, `must have at least ${rules.min} items`);
    }
    
    if (rules.max !== undefined && arrayValue.length > rules.max) {
      throw new ConfigValidationError(key, `must have no more than ${rules.max} items`);
    }
    
    return arrayValue;
  }

  /**
   * Validate URL configuration value
   */
  static validateUrl(
    key: string,
    value: string | undefined,
    defaultValue?: string,
    rules: ValidationRule = {}
  ): string {
    const urlValue = this.validateString(key, value, defaultValue, rules);
    
    if (!urlValue) {
      return urlValue;
    }
    
    try {
      new URL(urlValue);
      return urlValue;
    } catch {
      throw new ConfigValidationError(key, 'must be a valid URL');
    }
  }
}