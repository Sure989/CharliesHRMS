import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTrainingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']),
  capacity: z.number().min(1).optional(),
  instructor: z.string().optional(),
  venue: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  certification: z.boolean().default(false),
  cost: z.number().min(0).optional(),
  category: z.string().optional(),
});

const updateTrainingSchema = createTrainingSchema.partial();

const enrollEmployeeSchema = z.object({
  employeeIds: z.array(z.string().uuid()),
});

const updateEnrollmentSchema = z.object({
  status: z.enum(['enrolled', 'in_progress', 'completed', 'failed', 'withdrawn']).optional(),
  progress: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  certificateIssued: z.boolean().optional(),
  completionDate: z.string().datetime().optional(),
});

// GET /api/trainings - Get all trainings
router.get('/', 
  authenticate, 
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { status, category, page = 1, limit = 10 } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { tenantId };
      if (status) where.status = status;
      if (category) where.category = category;
      
      const [trainings, total] = await Promise.all([
        prisma.training.findMany({
          where,
          include: {
            enrollments: {
              include: {
                employee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    position: true,
                    department: { select: { name: true } },
                    branch: { select: { name: true } }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.training.count({ where })
      ]);
      
      const formattedTrainings = trainings.map(training => ({
        ...training,
        enrolled: training.enrollments.length,
        enrollments: training.enrollments.map(enrollment => ({
          ...enrollment,
          employeeName: `${enrollment.employee.firstName} ${enrollment.employee.lastName}`,
          employeeEmail: enrollment.employee.email,
          position: enrollment.employee.position,
          department: enrollment.employee.department?.name,
          branch: enrollment.employee.branch?.name,
        }))
      }));
      
      res.json({
        status: 'success',
        data: {
          trainings: formattedTrainings,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching trainings:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch trainings' });
    }
  }
);

// GET /api/trainings/:id - Get training by ID
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      
      const training = await prisma.training.findFirst({
        where: { id, tenantId },
        include: {
          enrollments: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: { select: { name: true } },
                  branch: { select: { name: true } }
                }
              }
            }
          }
        }
      });
      
      if (!training) {
        return res.status(404).json({ status: 'error', message: 'Training not found' });
      }
      
      const formattedTraining = {
        ...training,
        enrolled: training.enrollments.length,
        enrollments: training.enrollments.map(enrollment => ({
          ...enrollment,
          employeeName: `${enrollment.employee.firstName} ${enrollment.employee.lastName}`,
          employeeEmail: enrollment.employee.email,
          position: enrollment.employee.position,
          department: enrollment.employee.department?.name,
          branch: enrollment.employee.branch?.name,
        }))
      };
      
      res.json({
        status: 'success',
        data: formattedTraining
      });
    } catch (error) {
      console.error('Error fetching training:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch training' });
    }
  }
);

// POST /api/trainings - Create new training
router.post('/',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const validatedData = createTrainingSchema.parse(req.body);
      
      const training = await prisma.training.create({
        data: {
          ...validatedData,
          tenantId,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
        },
        include: {
          enrollments: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: { select: { name: true } },
                  branch: { select: { name: true } }
                }
              }
            }
          }
        }
      });
      
      res.status(201).json({
        status: 'success',
        data: {
          ...training,
          enrolled: training.enrollments.length
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues
        });
      }
      console.error('Error creating training:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create training' });
    }
  }
);

// PUT /api/trainings/:id - Update training
router.put('/:id',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      const validatedData = updateTrainingSchema.parse(req.body);
      
      const updateData: any = { ...validatedData };
      if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
      if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);
      
      const training = await prisma.training.update({
        where: { id, tenantId },
        data: updateData,
        include: {
          enrollments: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: { select: { name: true } },
                  branch: { select: { name: true } }
                }
              }
            }
          }
        }
      });
      
      res.json({
        status: 'success',
        data: {
          ...training,
          enrolled: training.enrollments.length
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues
        });
      }
      console.error('Error updating training:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update training' });
    }
  }
);

// DELETE /api/trainings/:id - Delete training
router.delete('/:id',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      
      await prisma.training.delete({
        where: { id, tenantId }
      });
      
      res.json({
        status: 'success',
        message: 'Training deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting training:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete training' });
    }
  }
);

// POST /api/trainings/:id/enroll - Enroll employees in training
router.post('/:id/enroll',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      const { employeeIds } = enrollEmployeeSchema.parse(req.body);
      
      // Check if training exists
      const training = await prisma.training.findFirst({
        where: { id, tenantId },
        include: { enrollments: true }
      });
      
      if (!training) {
        return res.status(404).json({ status: 'error', message: 'Training not found' });
      }
      
      // Check capacity
      if (training.capacity && training.enrollments.length + employeeIds.length > training.capacity) {
        return res.status(400).json({
          status: 'error',
          message: 'Not enough capacity for all selected employees'
        });
      }
      
      // Check if employees exist in the same tenant
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          tenantId
        }
      });
      
      if (employees.length !== employeeIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Some employees not found or not in your organization'
        });
      }
      
      // Create enrollments (ignore duplicates)
      const enrollments = await Promise.allSettled(
        employeeIds.map(employeeId =>
          prisma.trainingEnrollment.create({
            data: {
              trainingId: id,
              employeeId,
              status: 'enrolled'
            },
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: { select: { name: true } },
                  branch: { select: { name: true } }
                }
              }
            }
          })
        )
      );
      
      const successful = enrollments.filter(result => result.status === 'fulfilled').length;
      const failed = enrollments.filter(result => result.status === 'rejected').length;
      
      res.json({
        status: 'success',
        message: `Enrolled ${successful} employees successfully${failed > 0 ? `, ${failed} failed (possibly already enrolled)` : ''}`,
        data: {
          successful,
          failed
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues
        });
      }
      console.error('Error enrolling employees:', error);
      res.status(500).json({ status: 'error', message: 'Failed to enroll employees' });
    }
  }
);

// PUT /api/trainings/:id/enrollments/:enrollmentId - Update enrollment
router.put('/:id/enrollments/:enrollmentId',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { id, enrollmentId } = req.params;
      const validatedData = updateEnrollmentSchema.parse(req.body);
      
      const updateData: any = { ...validatedData };
      if (validatedData.completionDate) {
        updateData.completionDate = new Date(validatedData.completionDate);
      }
      
      const enrollment = await prisma.trainingEnrollment.update({
        where: {
          id: enrollmentId,
          trainingId: id,
          training: { tenantId }
        },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: { select: { name: true } },
              branch: { select: { name: true } }
            }
          }
        }
      });
      
      res.json({
        status: 'success',
        data: {
          ...enrollment,
          employeeName: `${enrollment.employee.firstName} ${enrollment.employee.lastName}`,
          employeeEmail: enrollment.employee.email,
          position: enrollment.employee.position,
          department: enrollment.employee.department?.name,
          branch: enrollment.employee.branch?.name,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues
        });
      }
      console.error('Error updating enrollment:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update enrollment' });
    }
  }
);

// DELETE /api/trainings/:id/enrollments/:enrollmentId - Remove enrollment
router.delete('/:id/enrollments/:enrollmentId',
  authenticate,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { id, enrollmentId } = req.params;
      
      await prisma.trainingEnrollment.delete({
        where: {
          id: enrollmentId,
          trainingId: id,
          training: { tenantId }
        }
      });
      
      res.json({
        status: 'success',
        message: 'Enrollment removed successfully'
      });
    } catch (error) {
      console.error('Error removing enrollment:', error);
      res.status(500).json({ status: 'error', message: 'Failed to remove enrollment' });
    }
  }
);

export default router;
