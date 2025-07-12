import { Request, Response } from 'express';
import { prisma } from '../index';

export const getPerformanceReviews = async (req: Request, res: Response) => {
  try {
    // Fetch reviews with employee, reviewer, and cycle info
    const reviews = await prisma.performanceReview.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            branch: {
              select: { name: true }
            },
            department: {
              select: { name: true }
            }
          }
        },
        reviewCycle: {
          select: { name: true }
        },
        // Optionally include reviewer info if needed
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map to frontend shape
    const mapped = reviews.map(r => ({
      id: r.id,
      employee: {
        id: r.employee.id,
        name: `${r.employee.firstName} ${r.employee.lastName}`,
        department: r.employee.department?.name || '',
        branch: r.employee.branch?.name || '',
        position: r.employee.position || '',
      },
      reviewer: r.reviewerId, // You may want to join User for reviewer name
      period: r.reviewCycle?.name || '',
      score: r.overallRating,
      summary: r.overallComments,
      status: r.status,
      createdAt: r.createdAt,
    }));
    res.json({ reviews: mapped });
  } catch (e) {
    console.error('Error fetching performance reviews:', e);
    res.status(500).json({ error: 'Failed to fetch performance reviews' });
  }
};
