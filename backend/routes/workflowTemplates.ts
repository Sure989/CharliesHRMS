import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all workflow templates (optionally filter by tenant)
router.get('/api/workflow-templates', async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string | undefined;
    const where = tenantId ? { tenantId } : {};
    const templates = await prisma.workflowTemplate.findMany({ where });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow templates' });
  }
});

// POST create a new workflow template
router.post('/api/workflow-templates', async (req: Request, res: Response) => {
  try {
    const template = await prisma.workflowTemplate.create({
      data: req.body
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create workflow template' });
  }
});

export default router;
