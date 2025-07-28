import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getPerformanceReviews = async (req: Request, res: Response) => {
  try {
    // Get tenant ID from request (set by auth middleware)
    const tenantId = req.tenantId!;
    
    // Fetch reviews with employee, reviewer, and cycle info
    const reviews = await prisma.performanceReview.findMany({
      where: {
        tenantId
      },
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
        }
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
      reviewer: 'HR Manager',
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

export const createPerformanceReview = async (req: Request, res: Response) => {
  try {
    const { employeeId, reviewPeriod, reviewType, goals, feedback, reviewDate, reviewer } = req.body;
    
    // Get tenant ID from request (set by auth middleware)
    const tenantId = req.tenantId!;
    
    // Create or find a review cycle for this period
    let reviewCycle = await prisma.performanceReviewCycle.findFirst({
      where: {
        name: reviewPeriod,
        tenantId
      }
    });
    
    if (!reviewCycle) {
      // Create a new review cycle
      const reviewDateObj = new Date(reviewDate);
      reviewCycle = await prisma.performanceReviewCycle.create({
        data: {
          name: reviewPeriod,
          description: `${reviewType} review cycle`,
          startDate: new Date(reviewDateObj.getFullYear(), reviewDateObj.getMonth(), 1),
          endDate: new Date(reviewDateObj.getFullYear(), reviewDateObj.getMonth() + 1, 0),
          reviewDeadline: reviewDateObj,
          status: 'ACTIVE',
          tenantId
        }
      });
    }
    
    // Create the performance review
    const review = await prisma.performanceReview.create({
      data: {
        employeeId,
        reviewCycleId: reviewCycle.id,
        reviewerId: req.user?.userId || 'system',
        status: 'DRAFT',
        goals: goals || '',
        overallComments: feedback || '',
        tenantId
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            branch: { select: { name: true } },
            department: { select: { name: true } }
          }
        },
        reviewCycle: {
          select: { name: true }
        }
      }
    });
    
    // Map to frontend format
    const mapped = {
      id: review.id,
      employee: {
        id: review.employee.id,
        name: `${review.employee.firstName} ${review.employee.lastName}`,
        department: review.employee.department?.name || '',
        branch: review.employee.branch?.name || '',
        position: review.employee.position || '',
      },
      reviewer: 'HR Manager',
      period: review.reviewCycle?.name || '',
      score: review.overallRating,
      summary: review.overallComments,
      status: review.status,
      createdAt: review.createdAt,
    };
    
    res.status(201).json({ review: mapped });
  } catch (e) {
    console.error('Error creating performance review:', e);
    res.status(500).json({ error: 'Failed to create performance review' });
  }
};
