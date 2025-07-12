import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import config from './config/config';

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Apply middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// // Apply rate limiting (more lenient for development)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: config.nodeEnv === 'development' ? 1000 : 100, // Higher limit for development
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let dbError = null;
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
import authRoutes from './routes/auth.routes';
import departmentRoutes from './routes/department.routes';
import branchRoutes from './routes/branch.routes';
import employeeRoutes from './routes/employee.routes';
import payrollRoutes from './routes/payroll.routes';
import leaveRoutes from './routes/leave.routes';
import analyticsRoutes from './routes/analytics.routes';
import userRoutes from './routes/user.routes';
import securityRoutes from './routes/security.routes';
import workflowTemplatesRouter from './routes/workflowTemplates.routes';
import performanceReviewsRouter from './routes/performanceReviews';
import integrationRoutes from './routes/integration.routes';
import workflowRoutes from './routes/workflow.routes';
import salaryAdvanceRoutes from './routes/salaryAdvance.routes';
import securityMetricsRoutes from './routes/securityMetrics.routes';
import adminRoutes from './routes/admin.routes';
import trainingRoutes from './routes/training.routes';

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
app.use('/api/security', securityMetricsRoutes); // security metrics route
app.use('/api/admin', adminRoutes); // admin routes
app.use('/api/trainings', trainingRoutes); // training routes
// TODO: Add more routes

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : undefined,
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
