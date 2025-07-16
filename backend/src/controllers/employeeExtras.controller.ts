import { Request, Response } from 'express';
import { prisma } from '../index';

// Get recent activities for an employee
export const getEmployeeActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Example: fetch recent activities for the employee (customize as needed)
    // Use AuditLog as activity source (customize if you have a dedicated Activity model)
    const activities = await prisma.auditLog.findMany({
      where: { userId: id, tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return res.status(200).json({ status: 'success', data: activities });
  } catch (error) {
    console.error('Get employee activity error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching activity data' });
  }
};

// Get training progress for an employee
export const getTrainingProgress = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Example: fetch training enrollments and completion status
    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { employeeId },
      select: { completionDate: true }
    });
    const completed = enrollments.filter(e => e.completionDate !== null).length;
    const total = enrollments.length;
    return res.status(200).json({ status: 'success', data: { completed, total } });
  } catch (error) {
    console.error('Get training progress error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching training progress' });
  }
};
