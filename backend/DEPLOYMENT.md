# Charlie's HRMS Backend Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- Node.js installed
- Vercel account (free at vercel.com)
- Supabase database already set up

### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables
Make sure these are set in your Vercel dashboard:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `CORS_ORIGIN`
- `NODE_ENV=production`

### Post-Deployment
Your API will be available at: `https://your-project-name.vercel.app`

Test endpoints:
- Health check: `/api/health`
- Database test: `/api/test`
- Root: `/`

### Troubleshooting
- Check Vercel function logs in dashboard
- Ensure all environment variables are set
- Verify database connectivity