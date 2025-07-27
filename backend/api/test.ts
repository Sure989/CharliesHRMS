import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
  } finally {
    await prisma.$disconnect();
  }
}