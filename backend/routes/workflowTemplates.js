const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all workflow templates (optionally filter by tenant)
router.get('/api/workflow-templates', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const where = tenantId ? { tenantId } : {};
    const templates = await prisma.workflowTemplate.findMany({ where });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow templates' });
  }
});

// POST create a new workflow template
router.post('/api/workflow-templates', async (req, res) => {
  try {
    const template = await prisma.workflowTemplate.create({
      data: req.body
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create workflow template' });
  }
});

module.exports = router;
