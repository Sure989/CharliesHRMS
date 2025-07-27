# Supabase Database Setup Guide

## Overview
This guide explains how to seed your Supabase database using your existing Prisma setup.

## Why This Approach is Better

✅ **Uses your existing Prisma setup** - No need for additional Supabase client dependencies
✅ **Maintains consistency** - Same data structure as your local development
✅ **Environment-aware** - Automatically detects Supabase connection
✅ **No interference** - Won't affect your local setup when you switch back

## Prerequisites

1. Your `.env` file should have the Supabase DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres.itfiwlttlmiphkgvqbyj:C3wwDZuD81uTrS0s@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"
```

2. Ensure your Prisma schema is up to date:
```bash
npm run prisma:generate
```

## Running the Supabase Seed

### Option 1: Direct Seeding (Recommended)
```bash
npm run supabase:seed
```

### Option 2: Using your existing seed (if DATABASE_URL points to Supabase)
```bash
npm run prisma:seed
```

## What Gets Seeded

- ✅ Default tenant (Charlie's HRMS)
- ✅ Demo users (admin, hr, operations)
- ✅ Departments (Operations, HR, Finance, etc.)
- ✅ Branches (SOHO, OYSTER BAR, GEMINI BISTRO, etc.)
- ✅ 33 Employees with proper department/branch assignments
- ✅ Leave types and policies
- ✅ Payroll periods

## Safety Features

- 🔒 **Connection Verification**: Automatically checks if you're connected to Supabase
- 🧹 **Clean Slate**: Safely clears existing data before seeding
- 📊 **Progress Logging**: Shows detailed progress during seeding
- ❌ **Error Handling**: Graceful error handling with clear messages

## Switching Between Local and Supabase

### For Local Development:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hrms_db"
```
Then run: `npm run prisma:seed`

### For Supabase:
```env
DATABASE_URL="postgresql://postgres.itfiwlttlmiphkgvqbyj:C3wwDZuD81uTrS0s@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"
```
Then run: `npm run supabase:seed`

## Troubleshooting

### Connection Issues
- Ensure your Supabase project is active
- Check that the DATABASE_URL is correct
- Verify your IP is allowed in Supabase settings

### Permission Issues
- Make sure you're using the correct connection string with proper credentials
- Check that your Supabase project has the necessary permissions

### Data Issues
- The script will clear existing data before seeding
- If you need to preserve data, backup first using Supabase dashboard

## Demo Credentials

After seeding, you can login with:

**Admin User:**
- Email: `admin@charlieshrms.com`
- Password: `password123`

**HR Manager:**
- Email: `hr@charlieshrms.com`
- Password: `password123`

**Operations Manager:**
- Email: `operations@charlieshrms.com`
- Password: `password123`

All employee users also have the password: `password123`