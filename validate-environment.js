#!/usr/bin/env node

/**
 * Environment Validation Script for Charlie's HRMS
 * 
 * This script validates that all required environment variables are properly set
 * for both backend and frontend applications.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to colorize console output
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Helper function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Helper function to read environment file
function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        env[key.trim()] = value.trim();
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

// Helper function to validate variable
function validateVariable(env, key, requirements = {}) {
  const value = env[key];
  const result = {
    key,
    exists: !!value,
    value: value || '',
    valid: true,
    issues: []
  };

  if (!value) {
    result.valid = false;
    result.issues.push('Variable is not set');
    return result;
  }

  // Check minimum length
  if (requirements.minLength && value.length < requirements.minLength) {
    result.valid = false;
    result.issues.push(`Must be at least ${requirements.minLength} characters long`);
  }

  // Check format
  if (requirements.format) {
    if (!requirements.format.test(value)) {
      result.valid = false;
      result.issues.push('Invalid format');
    }
  }

  // Check not default value
  if (requirements.notDefault && requirements.notDefault.includes(value)) {
    result.valid = false;
    result.issues.push('Using default/example value');
  }

  return result;
}

// Backend environment validation
function validateBackend() {
  console.log(colorize('\n🔧 BACKEND ENVIRONMENT VALIDATION', 'cyan'));
  console.log('='.repeat(50));

  const envPath = path.join(__dirname, 'backend', '.env');
  
  if (!fileExists(envPath)) {
    console.log(colorize('❌ Backend .env file not found', 'red'));
    console.log(colorize('   Create it by copying backend/.env.example', 'yellow'));
    return false;
  }

  console.log(colorize('✅ Backend .env file exists', 'green'));

  const env = readEnvFile(envPath);
  if (!env) {
    console.log(colorize('❌ Failed to read .env file', 'red'));
    return false;
  }

  // Define validation requirements
  const requirements = {
    JWT_SECRET: {
      minLength: 32,
      notDefault: [
        'your-super-secret-jwt-key-here',
        'your-super-secret-jwt-key-minimum-32-characters-long'
      ]
    },
    DATABASE_URL: {
      format: /^postgresql:\/\//,
      notDefault: [
        'postgresql://username:password@host:port/database',
        'postgresql://postgres.your-project-id:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
      ]
    },
    SUPABASE_URL: {
      format: /^https:\/\/.*\.supabase\.co$/,
      notDefault: ['https://your-project-id.supabase.co']
    },
    SUPABASE_SECRET_KEY: {
      format: /^eyJ/,
      notDefault: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-secret-key']
    }
  };

  const criticalVars = ['JWT_SECRET', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
  const optionalVars = ['PORT', 'NODE_ENV', 'CORS_ORIGIN', 'FRONTEND_URL'];

  let allValid = true;

  // Validate critical variables
  console.log(colorize('\n🔴 Critical Variables:', 'red'));
  criticalVars.forEach(key => {
    const result = validateVariable(env, key, requirements[key]);
    
    if (result.valid) {
      console.log(colorize(`✅ ${key}`, 'green'));
    } else {
      console.log(colorize(`❌ ${key}`, 'red'));
      result.issues.forEach(issue => {
        console.log(colorize(`   - ${issue}`, 'yellow'));
      });
      allValid = false;
    }
  });

  // Validate optional variables
  console.log(colorize('\n🟡 Optional Variables:', 'yellow'));
  optionalVars.forEach(key => {
    const result = validateVariable(env, key);
    
    if (result.exists) {
      console.log(colorize(`✅ ${key}: ${result.value}`, 'green'));
    } else {
      console.log(colorize(`⚠️  ${key}: Not set (using default)`, 'yellow'));
    }
  });

  return allValid;
}

// Frontend environment validation
function validateFrontend() {
  console.log(colorize('\n🎨 FRONTEND ENVIRONMENT VALIDATION', 'cyan'));
  console.log('='.repeat(50));

  const envPath = path.join(__dirname, 'frontend', '.env.local');
  
  if (!fileExists(envPath)) {
    console.log(colorize('❌ Frontend .env.local file not found', 'red'));
    console.log(colorize('   Create it by copying frontend/.env.example', 'yellow'));
    return false;
  }

  console.log(colorize('✅ Frontend .env.local file exists', 'green'));

  const env = readEnvFile(envPath);
  if (!env) {
    console.log(colorize('❌ Failed to read .env.local file', 'red'));
    return false;
  }

  // Define validation requirements
  const requirements = {
    VITE_API_BASE_URL: {
      format: /^https?:\/\//,
      notDefault: ['https://charlies-hrms-backend.vercel.app/api', 'http://localhost:3001/api']
    }
  };

  const criticalVars = ['VITE_API_BASE_URL'];
  const optionalVars = [
    'VITE_APP_NAME', 
    'VITE_NODE_ENV', 
    'VITE_ENABLE_MOCK_DATA',
    'VITE_DEFAULT_CURRENCY'
  ];

  let allValid = true;

  // Validate critical variables
  console.log(colorize('\n🔴 Critical Variables:', 'red'));
  criticalVars.forEach(key => {
    const result = validateVariable(env, key, requirements[key]);
    
    if (result.valid) {
      console.log(colorize(`✅ ${key}: ${result.value}`, 'green'));
    } else {
      console.log(colorize(`❌ ${key}`, 'red'));
      result.issues.forEach(issue => {
        console.log(colorize(`   - ${issue}`, 'yellow'));
      });
      allValid = false;
    }
  });

  // Validate optional variables
  console.log(colorize('\n🟡 Optional Variables:', 'yellow'));
  optionalVars.forEach(key => {
    const result = validateVariable(env, key);
    
    if (result.exists) {
      console.log(colorize(`✅ ${key}: ${result.value}`, 'green'));
    } else {
      console.log(colorize(`⚠️  ${key}: Not set (using default)`, 'yellow'));
    }
  });

  return allValid;
}

// Security checks
function performSecurityChecks() {
  console.log(colorize('\n🔒 SECURITY CHECKS', 'cyan'));
  console.log('='.repeat(50));

  let securityIssues = 0;

  // Check if .env files are in .gitignore
  const gitignorePath = path.join(__dirname, '.gitignore');
  if (fileExists(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    
    if (gitignore.includes('.env')) {
      console.log(colorize('✅ .env files are in .gitignore', 'green'));
    } else {
      console.log(colorize('❌ .env files not found in .gitignore', 'red'));
      console.log(colorize('   Add .env and .env.local to .gitignore', 'yellow'));
      securityIssues++;
    }
  }

  // Check for common security issues
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  if (fileExists(backendEnvPath)) {
    const env = readEnvFile(backendEnvPath);
    
    if (env.MOCK_LOGIN_ENABLED === 'true') {
      console.log(colorize('⚠️  Mock login is enabled', 'yellow'));
      console.log(colorize('   Disable in production: MOCK_LOGIN_ENABLED=false', 'yellow'));
    } else {
      console.log(colorize('✅ Mock login is disabled', 'green'));
    }

    if (env.NODE_ENV === 'production' && env.JWT_SECRET && env.JWT_SECRET.includes('your-')) {
      console.log(colorize('❌ Using default JWT secret in production', 'red'));
      securityIssues++;
    }
  }

  return securityIssues === 0;
}

// Main validation function
function main() {
  console.log(colorize('🔍 CHARLIE\'S HRMS ENVIRONMENT VALIDATION', 'magenta'));
  console.log(colorize('=' .repeat(60), 'magenta'));

  const backendValid = validateBackend();
  const frontendValid = validateFrontend();
  const securityValid = performSecurityChecks();

  console.log(colorize('\n📊 VALIDATION SUMMARY', 'cyan'));
  console.log('='.repeat(50));

  if (backendValid && frontendValid && securityValid) {
    console.log(colorize('🎉 All environment validations passed!', 'green'));
    console.log(colorize('✅ Your application is ready to run', 'green'));
    process.exit(0);
  } else {
    console.log(colorize('❌ Environment validation failed', 'red'));
    
    if (!backendValid) {
      console.log(colorize('   - Backend environment issues found', 'red'));
    }
    if (!frontendValid) {
      console.log(colorize('   - Frontend environment issues found', 'red'));
    }
    if (!securityValid) {
      console.log(colorize('   - Security issues found', 'red'));
    }

    console.log(colorize('\n💡 Next steps:', 'yellow'));
    console.log(colorize('   1. Fix the issues listed above', 'yellow'));
    console.log(colorize('   2. Refer to ENVIRONMENT_SETUP_GUIDE.md for help', 'yellow'));
    console.log(colorize('   3. Run this script again to validate', 'yellow'));
    
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  validateBackend,
  validateFrontend,
  performSecurityChecks
};