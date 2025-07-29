import { Request, Response } from 'express';

import prisma from '../lib/prisma';

export const getEmployeeDashboard = async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;
    // Fetch performance review rating
    const performanceReview = await prisma.performanceReview.findFirst({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch training progress
    const trainingProgress = await prisma.trainingProgress.findMany({
      where: { employeeId }
    });

    // Fetch other relevant info (add more queries as needed)
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        branch: true
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        employee,
        performanceReviewRating: performanceReview?.rating ?? null,
        trainingData: trainingProgress,
        lastReview: performanceReview,
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch employee dashboard',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
