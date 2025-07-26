import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import config from './src/config/config';

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Charlie\'s HRMS API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      employees: '/api/employees'
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let dbError: string | null = null;
  try {
    // Simple DB query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'warning';
    dbError = error instanceof Error ? error.message : String(error);
  }
  const status = dbStatus === 'healthy' ? 'success' : 'warning';
  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status,
    message: dbStatus === 'healthy' ? 'HRMS API is running' : 'Database connectivity issue',
    environment: config.nodeEnv,
    dbStatus,
    dbError,
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import authRoutes from './src/routes/auth.routes';
import departmentRoutes from './src/routes/department.routes';
import branchRoutes from './src/routes/branch.routes';
import employeeRoutes from './src/routes/employee.routes';
import payrollRoutes from './src/routes/payroll.routes';
import leaveRoutes from './src/routes/leave.routes';
import analyticsRoutes from './src/routes/analytics.routes';
import userRoutes from './src/routes/user.routes';
import securityRoutes from './src/routes/security.routes';
import workflowTemplatesRouter from './src/routes/workflowTemplates.routes';
import performanceReviewsRouter from './src/routes/performanceReviews.routes';
import integrationRoutes from './src/routes/integration.routes';
import workflowRoutes from './src/routes/workflow.routes';
import salaryAdvanceRoutes from './src/routes/salaryAdvance.routes';
import securityMetricsRoutes from './src/routes/securityMetrics.routes';
import adminRoutes from './src/routes/admin.routes';
import trainingRoutes from './src/routes/training.routes';
import notificationRoutes from './src/routes/notification.routes';
import dashboardRoutes from './src/routes/dashboard.routes';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/workflow-templates', workflowTemplatesRouter);
app.use('/api/performance-reviews', performanceReviewsRouter);
app.use('/api/integrations', integrationRoutes);
app.use('/api/integration-logs', integrationRoutes); // logs handled in integration.routes.ts
app.use('/api/integration-summary', integrationRoutes); // summary handled in integration.routes.ts
app.use('/api/workflows', workflowRoutes);
app.use('/api/approvals', workflowRoutes); // approvals handled in workflow.routes.ts
app.use('/api/workflow-stats', workflowRoutes); // stats handled in workflow.routes.ts
app.use('/api/salary-advances', salaryAdvanceRoutes); // salary advances route
app.use('/api/security-metrics', securityMetricsRoutes); // security metrics route
app.use('/api/admin', adminRoutes); // admin routes
app.use('/api/trainings', trainingRoutes); // training routes
app.use('/api/notifications', notificationRoutes); // notification routes
app.use('/api/dashboard', dashboardRoutes); // dashboard routes
// TODO: Add more routes

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  });
}

// Export for Vercel
module.exports = app;
export default app;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  prisma.$disconnect();
  process.exit(0);
});
