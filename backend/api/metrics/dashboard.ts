import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for frontend only
  res.setHeader('Access-Control-Allow-Origin', 'https://charlies-hrms-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

  try {
    const [totalUsers, activeUsers, totalDepartments, totalBranches] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.department.count(),
      prisma.branch.count(),
    ]);

    // Ensure all fields are present and defaulted
    const metrics = {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0,
      totalDepartments: totalDepartments ?? 0,
      totalBranches: totalBranches ?? 0,
      systemUptime: '99.8%',
      avgResponseTime: '120ms',
      storageUsed: 68
    };

    return res.status(200).json({
      status: 'success',
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
