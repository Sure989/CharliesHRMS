import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client with connection pooling for serverless
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Charlie\'s HRMS API is running',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'success',
      message: 'HRMS API is running',
      dbStatus: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connectivity issue',
      dbStatus: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Test endpoint to check seeded data
app.get('/api/test', async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.count();
    const employees = await prisma.employee.count();
    const departments = await prisma.department.count();
    const branches = await prisma.branch.count();
    
    res.json({
      status: 'success',
      message: 'Database test successful',
      data: {
        tenants,
        users,
        employees,
        departments,
        branches
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Import routes
import authRoutes from './src/routes/auth.routes';
import departmentRoutes from './src/routes/department.routes';
import branchRoutes from './src/routes/branch.routes';
import employeeRoutes from './src/routes/employee.routes';
import userRoutes from './src/routes/user.routes';
import leaveRoutes from './src/routes/leave.routes';
import notificationRoutes from './src/routes/notification.routes';
import adminRoutes from './src/routes/admin.routes';
import analyticsRoutes from './src/routes/analytics.routes';
import payrollRoutes from './src/routes/payroll.routes';
import salaryAdvanceRoutes from './src/routes/salaryAdvance.routes';
import dashboardRoutes from './src/routes/dashboard.routes';
import integrationRoutes from './src/routes/integration.routes';
import securityRoutes from './src/routes/security.routes';
import employeeExtrasRoutes from './src/routes/employeeExtras.routes';
import performanceReviewsRoutes from './src/routes/performanceReviews.routes';
import securityMetricsRoutes from './src/routes/securityMetrics.routes';
import trainingRoutes from './src/routes/training.routes';
import workflowRoutes from './src/routes/workflow.routes';
import workflowTemplatesRoutes from './src/routes/workflowTemplates.routes';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/salary-advances', salaryAdvanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/employee-extras', employeeExtrasRoutes);
app.use('/api/performance-reviews', performanceReviewsRoutes);
app.use('/api/security-metrics', securityMetricsRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/workflow-templates', workflowTemplatesRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless
export default app;