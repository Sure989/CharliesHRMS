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

// Import only core routes that definitely exist
try {
  const authRoutes = require('./src/routes/auth.routes').default;
  const departmentRoutes = require('./src/routes/department.routes').default;
  const branchRoutes = require('./src/routes/branch.routes').default;
  const employeeRoutes = require('./src/routes/employee.routes').default;
  const userRoutes = require('./src/routes/user.routes').default;
  const leaveRoutes = require('./src/routes/leave.routes').default;
  const notificationRoutes = require('./src/routes/notification.routes').default;
  
  // Use core routes
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/notifications', notificationRoutes);
} catch (error) {
  console.error('Route import error:', error);
}

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