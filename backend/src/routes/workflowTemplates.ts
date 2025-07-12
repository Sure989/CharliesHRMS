import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET all workflow templates (optionally filter by tenant)
router.get('/api/workflow-templates', async (req, res) => {
  try {
    const tenantId = req.query.tenantId as string | undefined;
    const where = tenantId ? { tenantId } : {};
    const templates = await prisma.workflowTemplate.findMany({ where });
    res.json({ status: 'success', data: templates });
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Failed to fetch workflow templates' });
  }
});

// POST create a new workflow template
router.post('/api/workflow-templates', async (req, res) => {
  try {
    const template = await prisma.workflowTemplate.create({
      data: req.body
    });
    res.status(201).json({ status: 'success', data: template });
  } catch (err) {
    res.status(400).json({ status: 'error', error: 'Failed to create workflow template' });
  }
});

export default router;
