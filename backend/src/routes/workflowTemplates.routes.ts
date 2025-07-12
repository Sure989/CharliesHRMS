import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET all workflow templates
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const templates = await prisma.workflowTemplate.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdDate: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      data: templates,
      message: 'Workflow templates retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving workflow templates:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve workflow templates',
    });
  }
});

// POST create a new workflow template
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        ...req.body,
        tenantId: req.tenantId
      }
    });

    return res.status(201).json({
      status: 'success',
      data: template,
      message: 'Workflow template created successfully',
    });
  } catch (error) {
    console.error('Error creating workflow template:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create workflow template',
    });
  }
});

export default router;
