import { Request, Response } from 'express';
import { prisma } from '../index';

// Helper function to seed initial audit logs if none exist
async function seedInitialAuditLogsIfNeeded(tenantId: string) {
  const failedLoginCount = await prisma.auditLog.count({
    where: {
      tenantId,
      action: 'FAILED_LOGIN',
    },
  });

  if (failedLoginCount === 0) {
    console.log('No failed login logs found for tenant, creating sample logs:', tenantId);

    const sampleLogs = [
      {
        action: 'FAILED_LOGIN',
        entity: 'USER',
        entityId: 'unknown@example.com',
        details: { reason: 'invalid_credentials', ipAddress: '192.168.1.35' },
        tenantId,
      },
      {
        action: 'FAILED_LOGIN',
        entity: 'USER',
        entityId: 'test@example.com',
        details: { reason: 'account_locked', ipAddress: '192.168.1.42' },
        tenantId,
      },
      {
        action: 'FAILED_LOGIN',
        entity: 'USER',
        entityId: 'admin@example.com',
        details: { reason: 'invalid_password', ipAddress: '192.168.1.105' },
        tenantId,
      },
    ];

    await prisma.auditLog.createMany({
      data: sampleLogs,
    });

    console.log('Created sample failed login logs');
  }
}

export const getSecurityMetrics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ status: 'error', message: 'Missing tenantId.' });
    }

    // Seed initial audit logs if needed
    await seedInitialAuditLogsIfNeeded(tenantId);

    // Security Score: Example - based on audit logs, failed logins, and threats
    const failedLogins = await prisma.auditLog.count({
      where: {
        tenantId,
        action: 'FAILED_LOGIN',
      },
    });
    const activeThreats = await prisma.securityAlert.count({
      where: {
        tenantId,
        type: 'THREAT',
      },
    });

    // Security score calculation (example logic)
    let securityScore = 100;
    if (failedLogins > 10) securityScore -= 10;
    if (activeThreats > 0) securityScore -= 20 * activeThreats;
    if (securityScore < 0) securityScore = 0;

    res.status(200).json({
      status: 'success',
      data: {
        securityScore,
        activeThreats,
        failedLogins,
      },
    });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch security metrics.',
    });
  }
};
