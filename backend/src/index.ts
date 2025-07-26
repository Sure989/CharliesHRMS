import { WebSocketServer, WebSocket } from 'ws';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
// Removed unused import: rateLimit
import { PrismaClient } from '@prisma/client';
import config from './config/config';

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// CORS: Allow only specified origins in production
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (process.env.NODE_ENV === 'production') {
      // Only allow explicit origins in production
      if (Array.isArray(config.cors.origin) && config.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: ' + origin));
    } else {
      // Allow localhost (any port) in dev
      const localhost = /^http:\/\/localhost(:\d+)?$/;
      if (localhost.test(origin)) {
        return callback(null, true);
      }
      if (Array.isArray(config.cors.origin) && config.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
}));

// Rate limiting: apply to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// WebSocket servers for real-time system status and dashboard metrics
const server = http.createServer(app);
const wssSystemStatus = new WebSocketServer({ noServer: true });
const wssDashboardMetrics = new WebSocketServer({ noServer: true });

// Apply middleware

app.use(helmet()); // Security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket server for real-time system status
function getSystemStatus() {
  // You can expand this to fetch real status from DB, services, etc.
  return {
    overall: 'healthy',
    database: 'healthy',
    authentication: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    lastChecked: new Date().toISOString()
  };
}

wssSystemStatus.on('connection', (ws: WebSocket) => {
  ws.send(JSON.stringify(getSystemStatus()));
  const interval = setInterval(() => {
    ws.send(JSON.stringify(getSystemStatus()));
  }, 300000);
  ws.on('close', () => clearInterval(interval));
});



wssDashboardMetrics.on('connection', (ws: WebSocket, req) => {
  // ...existing code...
  let role = 'admin';
  let tenantId: string | undefined = undefined;
  
  try {
    const url = new URL(req.url || '', 'http://localhost');
    if (url.searchParams.has('role')) {
      role = url.searchParams.get('role') || 'admin';
    }
    // ...existing code...
  } catch (err) {
    // ...existing code...
  }

  const sendMetrics = async () => {
    try {
      // ...existing code...
      const { getDashboardMetrics } = await import('./services/analytics.service');
      const metrics = await getDashboardMetrics(tenantId || 'default');
      // ...existing code...
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(metrics));
        // ...existing code...
      } else {
        // ...existing code...
      }
    } catch (error) {
      // ...existing code...
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: 'Failed to fetch metrics' }));
      }
    }
  };

  sendMetrics();
  const interval = setInterval(sendMetrics, 30000);

  ws.on('close', (code, reason) => {
    // ...existing code...
    clearInterval(interval);
  });

  ws.on('error', (err) => {
    // ...existing code...
    clearInterval(interval);
  });
});

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';

  if (pathname === '/system-status') {
    wssSystemStatus.handleUpgrade(request, socket, head, (ws) => {
      wssSystemStatus.emit('connection', ws, request);
    });
  } else if (pathname === '/dashboard-metrics') {
    wssDashboardMetrics.handleUpgrade(request, socket, head, (ws) => {
      wssDashboardMetrics.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

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
import performanceReviewsRouter from './routes/performanceReviews.routes';
import integrationRoutes from './routes/integration.routes';
import workflowRoutes from './routes/workflow.routes';
import salaryAdvanceRoutes from './routes/salaryAdvance.routes';
import securityMetricsRoutes from './routes/securityMetrics.routes';
import adminRoutes from './routes/admin.routes';
import trainingRoutes from './routes/training.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';

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
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode (WebSocket enabled)`);
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
