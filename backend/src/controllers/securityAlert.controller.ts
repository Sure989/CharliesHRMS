import { Request, Response } from 'express';
import { prisma } from '../index';

// Helper function to seed initial security alerts if none exist
async function seedInitialAlertsIfNeeded(tenantId: string) {
  const alertCount = await prisma.securityAlert.count({ where: { tenantId } });

  if (alertCount === 0) {
    console.log('No alerts found for tenant, creating sample alerts:', tenantId);

    const sampleAlerts = [
      {
        type: 'WARNING',
        title: 'Failed Login Attempts',
        description: 'Multiple failed login attempts detected from IP 192.168.1.35',
        tenantId,
      },
      {
        type: 'THREAT',
        title: 'Suspicious Activity Detected',
        description: 'Unusual access pattern detected from unrecognized device',
        tenantId,
      },
      {
        type: 'INFO',
        title: 'Security Scan Completed',
        description: 'Weekly security scan completed with no critical issues',
        tenantId,
      },
    ];

    await prisma.securityAlert.createMany({
      data: sampleAlerts,
    });

    console.log('Created sample security alerts');
  }
}

export const getSecurityAlerts = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    console.log('TenantId:', tenantId);

    if (!tenantId) {
      console.warn('Missing tenantId in request');
      return res.status(400).json({ status: 'error', message: 'Missing tenantId.' });
    }

    // Seed initial alerts if needed
    await seedInitialAlertsIfNeeded(tenantId);

    const alerts = await prisma.securityAlert.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    console.log('Fetched security alerts:', alerts);
    return res.status(200).json({ status: 'success', data: alerts });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch security alerts.' });
  }
};

export const addSecurityAlert = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    console.log('TenantId:', tenantId);
    console.log('Request body:', req.body);

    if (!tenantId) {
      console.warn('Missing tenantId in request');
      return res.status(400).json({ status: 'error', message: 'Missing tenantId.' });
    }

    const { type, title, description, timestamp } = req.body;
    const alert = await prisma.securityAlert.create({
      data: {
        tenantId,
        type,
        title,
        description,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    console.log('Added security alert:', alert);
    return res.status(201).json({ status: 'success', data: alert });
  } catch (error) {
    console.error('Error adding security alert:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to add security alert.' });
  }
};
