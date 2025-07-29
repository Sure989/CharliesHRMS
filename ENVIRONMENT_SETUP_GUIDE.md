# 🔧 **ENVIRONMENT SETUP GUIDE**

## 📋 **OVERVIEW**

This guide will help you set up secure environment variables for both the backend and frontend of Charlie's HRMS application.

---

## 🚀 **QUICK SETUP**

### **1. Backend Environment Setup**

```bash
# Navigate to backend directory
cd backend

# Copy the example file
cp .env.example .env

# Edit the .env file with your actual values
# Use your preferred editor (VS Code, nano, vim, etc.)
code .env
```

### **2. Frontend Environment Setup**

```bash
# Navigate to frontend directory
cd frontend

# Copy the example file
cp .env.example .env.local

# Edit the .env.local file with your actual values
code .env.local
```

---

## 🔑 **REQUIRED ENVIRONMENT VARIABLES**

### **Backend (.env)**

#### **🔴 CRITICAL (Must be set)**

```env
# Strong JWT secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Supabase database connection
DATABASE_URL="postgresql://postgres.your-project:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-publishable-key
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-secret-key
```

#### **🟡 IMPORTANT (Recommended)**

```env
# Frontend URL for email links
FRONTEND_URL=https://charlies-hrms-frontend.vercel.app

# CORS configuration
CORS_ORIGIN=https://charlies-hrms-frontend.vercel.app,http://localhost:3000

# Security
MOCK_LOGIN_ENABLED=false
```

#### **🟢 OPTIONAL (Business Configuration)**

```env
# Business defaults
DEFAULT_DEPARTMENT_NAME=General
DEFAULT_BANK_NAME=Kenya Commercial Bank
MAX_SALARY_ADVANCE_PERCENT=50
MIN_EMPLOYMENT_TENURE_MONTHS=6
```

### **Frontend (.env.local)**

#### **🔴 CRITICAL (Must be set)**

```env
# Backend API URL
VITE_API_BASE_URL=https://charlies-hrms-backend.vercel.app/api

# Application environment
VITE_NODE_ENV=production
```

#### **🟡 IMPORTANT (Recommended)**

```env
# Application branding
VITE_APP_NAME=Charlie's HRMS
VITE_COMPANY_NAME=Charlie's Company

# Feature flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_LOGS=false

# Localization
VITE_DEFAULT_CURRENCY=KES
VITE_DEFAULT_LOCALE=en-KE
VITE_DEFAULT_TIMEZONE=Africa/Nairobi
```

---

## 🔐 **SECURITY BEST PRACTICES**

### **1. Generate Strong Secrets**

#### **JWT Secret Generation**

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator (use with caution)
# Visit: https://generate-secret.vercel.app/32
```

#### **Password Requirements**

- **JWT_SECRET**: Minimum 32 characters
- **Database passwords**: Strong, unique passwords
- **API keys**: Use official keys from service providers

### **2. Environment File Security**

#### **✅ DO**

- Keep `.env` files local only
- Use different secrets for development/production
- Rotate secrets regularly
- Use environment-specific configurations

#### **❌ DON'T**

- Commit `.env` files to version control
- Share secrets in chat/email
- Use weak or default passwords
- Hardcode secrets in source code

---

## 🌍 **DEPLOYMENT ENVIRONMENTS**

### **Development Environment**

```env
# Backend
NODE_ENV=development
MOCK_LOGIN_ENABLED=true
VITE_ENABLE_DEBUG_LOGS=true

# Frontend
VITE_NODE_ENV=development
VITE_ENABLE_DEV_TOOLS=true
VITE_SHOW_API_RESPONSES=true
```

### **Production Environment**

```env
# Backend
NODE_ENV=production
MOCK_LOGIN_ENABLED=false

# Frontend
VITE_NODE_ENV=production
VITE_ENABLE_DEBUG_LOGS=false
VITE_ENABLE_DEV_TOOLS=false
```

---

## 🔧 **PLATFORM-SPECIFIC SETUP**

### **Vercel Deployment**

#### **Backend Environment Variables**

```bash
# Set via Vercel dashboard or CLI
vercel env add JWT_SECRET
vercel env add DATABASE_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_SECRET_KEY
vercel env add CORS_ORIGIN
```

#### **Frontend Environment Variables**

```bash
# Set via Vercel dashboard or CLI
vercel env add VITE_API_BASE_URL
vercel env add VITE_APP_NAME
vercel env add VITE_NODE_ENV
```

### **Local Development**

#### **Using Docker (Optional)**

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    env_file:
      - ./backend/.env
    ports:
      - "5000:5000"
  
  frontend:
    build: ./frontend
    env_file:
      - ./frontend/.env.local
    ports:
      - "3000:3000"
```

---

## 🧪 **TESTING YOUR SETUP**

### **1. Backend Health Check**

```bash
# Start backend
cd backend
npm run dev

# Test health endpoint
curl http://localhost:5000/api/health
```

### **2. Frontend Connection Test**

```bash
# Start frontend
cd frontend
npm run dev

# Check browser console for API connection
# Visit: http://localhost:3000
```

### **3. Environment Validation**

```bash
# Backend validation
cd backend
npm run validate-env  # If you have this script

# Frontend validation
cd frontend
npm run validate-env  # If you have this script
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. "Missing required environment variables"**

```bash
# Check if .env file exists
ls -la backend/.env
ls -la frontend/.env.local

# Verify required variables are set
grep -E "JWT_SECRET|DATABASE_URL" backend/.env
```

#### **2. "CORS Error"**

```env
# Ensure CORS_ORIGIN includes your frontend URL
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000
```

#### **3. "Database Connection Failed"**

```env
# Verify DATABASE_URL format
DATABASE_URL="postgresql://postgres.project:password@host:6543/postgres?pgbouncer=true"
```

#### **4. "JWT Secret Too Short"**

```bash
# Generate a new 32+ character secret
openssl rand -base64 32
```

### **Environment Validation Script**

Create this script to validate your environment:

```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating environment variables..."

# Backend validation
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env file exists"
    
    # Check critical variables
    if grep -q "JWT_SECRET=" backend/.env; then
        echo "✅ JWT_SECRET is set"
    else
        echo "❌ JWT_SECRET is missing"
    fi
    
    if grep -q "DATABASE_URL=" backend/.env; then
        echo "✅ DATABASE_URL is set"
    else
        echo "❌ DATABASE_URL is missing"
    fi
else
    echo "❌ Backend .env file not found"
fi

# Frontend validation
if [ -f "frontend/.env.local" ]; then
    echo "✅ Frontend .env.local file exists"
    
    if grep -q "VITE_API_BASE_URL=" frontend/.env.local; then
        echo "✅ VITE_API_BASE_URL is set"
    else
        echo "❌ VITE_API_BASE_URL is missing"
    fi
else
    echo "❌ Frontend .env.local file not found"
fi

echo "🎉 Environment validation complete!"
```

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation Links**

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

### **Security Resources**

- [OWASP Environment Variables](https://owasp.org/www-community/vulnerabilities/Insecure_Configuration_Management)
- [12-Factor App Config](https://12factor.net/config)

---

## ✅ **SETUP CHECKLIST**

- [ ] **Backend .env file created and configured**
- [ ] **Frontend .env.local file created and configured**
- [ ] **JWT secret is 32+ characters long**
- [ ] **Database connection string is correct**
- [ ] **CORS origins include your frontend URL**
- [ ] **Mock login disabled in production**
- [ ] **Environment files added to .gitignore**
- [ ] **Secrets not committed to version control**
- [ ] **Production environment variables set in Vercel**
- [ ] **Health checks passing**

---

**🎯 Remember**: Never commit `.env` files to version control. Always use the `.env.example` files as templates and fill in your actual values locally.
