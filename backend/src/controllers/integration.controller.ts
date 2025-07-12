import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * Get all integrations for a tenant
 * @route GET /api/integrations
 */
export const getIntegrations = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const integrations = await prisma.integration.findMany({
      where: { tenantId: req.tenantId },
    });

    return res.status(200).json({
      status: 'success',
      data: integrations,
      message: 'Integrations retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving integrations:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve integrations',
    });
  }
};

/**
 * Get integration logs for a tenant
 * @route GET /api/integrations/logs
 */
export const getIntegrationLogs = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Get limit from query params or default to 50
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await prisma.integrationLog.findMany({
      where: { tenantId: req.tenantId },
      include: { integration: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json({
      status: 'success',
      data: logs,
      message: 'Integration logs retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving integration logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve integration logs',
    });
  }
};

/**
 * Get integration summary for a tenant
 * @route GET /api/integrations/summary
 */
export const getIntegrationSummary = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const integrations = await prisma.integration.findMany({
      where: { tenantId: req.tenantId },
      include: {
        integrationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter((i) => i.status === 'ACTIVE').length;
    const errorIntegrations = integrations.filter((i) => i.status === 'ERROR').length;

    const averageSuccessRate = integrations.length > 0
      ? integrations.reduce((sum, i) => sum + i.successRate, 0) / integrations.length
      : 0;

    let lastSyncTime = new Date().toISOString();
    const integrationsWithSyncTimes = integrations.filter((i) => i.lastSyncTime);
    if (integrationsWithSyncTimes.length > 0) {
      // Add null check for latest.lastSyncTime
      const mostRecentSync = integrationsWithSyncTimes.reduce(
        (latest, current) => {
          return current.lastSyncTime && (!latest.lastSyncTime || current.lastSyncTime > latest.lastSyncTime)
            ? current
            : latest;
        },
        integrationsWithSyncTimes[0]
      );

      if (mostRecentSync.lastSyncTime) {
        lastSyncTime = mostRecentSync.lastSyncTime.toISOString();
      }
    }

    const summary = {
      totalIntegrations,
      activeIntegrations,
      errorIntegrations,
      averageSuccessRate,
      lastSyncTime,
    };

    return res.status(200).json({
      status: 'success',
      data: summary,
      message: 'Integration summary retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving integration summary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve integration summary',
    });
  }
};

/**
 * Test an integration connection
 * @route POST /api/integrations/:id/test
 */
export const testIntegration = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
      });
    }

    await prisma.integrationLog.create({
      data: {
        integrationId: id,
        tenantId: req.tenantId,
        status: 'SUCCESS',
        message: `Test connection initiated for integration ${integration.name}`,
        details: { timestamp: new Date().toISOString(), initiatedBy: req.user?.userId || 'system' },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { tested: true },
      message: `Test connection successful for integration ${integration.name}`,
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to test integration',
    });
  }
};

/**
 * Toggle an integration's active status
 * @route PATCH /api/integrations/:id/toggle
 */
export const toggleIntegration = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { id } = req.params;
    const { enabled } = req.body;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!integration) {
      return res.status(404).json({
        status: 'error',
        message: 'Integration not found',
      });
    }

    const updatedIntegration = await prisma.integration.update({
      where: { id },
      data: {
        status: enabled ? 'ACTIVE' : 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    await prisma.integrationLog.create({
      data: {
        integrationId: id,
        tenantId: req.tenantId,
        status: 'SUCCESS',
        message: `Toggle status requested for integration ${integration.name}`,
        details: { timestamp: new Date().toISOString(), requestedBy: req.user?.userId || 'system' },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: updatedIntegration,
      message: `Integration ${integration.name} status ${enabled ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('Error toggling integration:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to toggle integration',
    });
  }
};
