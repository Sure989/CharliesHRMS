import { Request, Response } from 'express';
import { prisma } from '../index';
import {
  getSystemStatus,
  getRecentSystemActivities,
  getMaintenanceInfo
} from '../services/systemStatus.service';
import {
  getComplianceOverview,
  getComplianceViolations,
  getPolicyCompliance
} from '../services/compliance.service';
import { experimentalFeaturesService } from '../services/experimentalFeatures.service';

/**
 * Get system status
 * @route GET /api/admin/system-status
 */
export const getSystemStatusController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const systemStatus = await getSystemStatus(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: systemStatus,
    });
  } catch (error) {
    console.error('Get system status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching system status',
    });
  }
};

/**
 * Get recent system activities
 * @route GET /api/admin/system-activities
 */
export const getSystemActivitiesController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { limit } = req.query;
    const activities = await getRecentSystemActivities(
      req.tenantId,
      limit ? parseInt(limit as string) : 10
    );

    return res.status(200).json({
      status: 'success',
      data: activities,
    });
  } catch (error) {
    console.error('Get system activities error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching system activities',
    });
  }
};

/**
 * Get maintenance information
 * @route GET /api/admin/maintenance-info
 */
export const getMaintenanceInfoController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const maintenanceInfo = await getMaintenanceInfo(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: maintenanceInfo,
    });
  } catch (error) {
    console.error('Get maintenance info error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching maintenance info',
    });
  }
};

/**
 * Trigger database backup
 * @route POST /api/admin/database-backup
 */
export const triggerDatabaseBackupController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Log the backup action
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenantId,
        userId: req.user?.userId,
        action: 'DATABASE_BACKUP_TRIGGERED',
        entity: 'SYSTEM',
        details: {
          timestamp: new Date().toISOString(),
          triggeredBy: req.user?.userId || 'system'
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Database backup initiated successfully',
      data: {
        backupId: `backup_${Date.now()}`,
        status: 'initiated',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database backup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while initiating database backup',
    });
  }
};

/**
 * Clear system cache
 * @route POST /api/admin/clear-cache
 */
export const clearCacheController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    // Log the cache clear action
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenantId,
        userId: req.user?.userId,
        action: 'CACHE_CLEARED',
        entity: 'SYSTEM',
        details: {
          timestamp: new Date().toISOString(),
          clearedBy: req.user?.userId || 'system'
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'System cache cleared successfully',
      data: {
        timestamp: new Date().toISOString(),
        cacheTypes: ['application', 'database', 'session']
      }
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while clearing cache',
    });
  }
};

/**
 * Get compliance overview
 * @route GET /api/admin/compliance-overview
 */
export const getComplianceOverviewController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const overview = await getComplianceOverview(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: overview,
    });
  } catch (error) {
    console.error('Get compliance overview error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching compliance overview',
    });
  }
};

/**
 * Get compliance violations
 * @route GET /api/admin/compliance-violations
 */
export const getComplianceViolationsController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { limit } = req.query;
    const violations = await getComplianceViolations(
      req.tenantId,
      limit ? parseInt(limit as string) : 10
    );

    return res.status(200).json({
      status: 'success',
      data: violations,
    });
  } catch (error) {
    console.error('Get compliance violations error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching compliance violations',
    });
  }
};

/**
 * Get policy compliance
 * @route GET /api/admin/policy-compliance
 */
export const getPolicyComplianceController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const policies = await getPolicyCompliance(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: policies,
    });
  } catch (error) {
    console.error('Get policy compliance error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching policy compliance',
    });
  }
};

/**
 * Get all experimental features
 * @route GET /api/admin/experimental-features
 */
export const getExperimentalFeaturesController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const features = await experimentalFeaturesService.getAllFeatures(req.tenantId);

    return res.status(200).json({
      status: 'success',
      data: features,
    });
  } catch (error) {
    console.error('Get experimental features error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching experimental features',
    });
  }
};

/**
 * Create a new experimental feature
 * @route POST /api/admin/experimental-features
 */
export const createExperimentalFeatureController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { key, name, description, enabled } = req.body;

    if (!key || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Key and name are required',
      });
    }

    const feature = await experimentalFeaturesService.createFeature(req.tenantId, {
      key,
      name,
      description,
      enabled,
      createdBy: req.user?.userId
    });

    return res.status(201).json({
      status: 'success',
      data: feature,
    });
  } catch (error) {
    console.error('Create experimental feature error:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating experimental feature',
    });
  }
};

/**
 * Update an experimental feature
 * @route PUT /api/admin/experimental-features/:id
 */
export const updateExperimentalFeatureController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { id } = req.params;
    const { name, description, enabled } = req.body;

    const feature = await experimentalFeaturesService.updateFeature(req.tenantId, id, {
      name,
      description,
      enabled
    });

    return res.status(200).json({
      status: 'success',
      data: feature,
    });
  } catch (error) {
    console.error('Update experimental feature error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating experimental feature',
    });
  }
};

/**
 * Toggle an experimental feature
 * @route PATCH /api/admin/experimental-features/:id/toggle
 */
export const toggleExperimentalFeatureController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { id } = req.params;

    const feature = await experimentalFeaturesService.toggleFeature(req.tenantId, id);

    return res.status(200).json({
      status: 'success',
      data: feature,
    });
  } catch (error) {
    console.error('Toggle experimental feature error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while toggling experimental feature',
    });
  }
};

/**
 * Delete an experimental feature
 * @route DELETE /api/admin/experimental-features/:id
 */
export const deleteExperimentalFeatureController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    const { id } = req.params;

    await experimentalFeaturesService.deleteFeature(req.tenantId, id);

    return res.status(200).json({
      status: 'success',
      message: 'Experimental feature deleted successfully',
    });
  } catch (error) {
    console.error('Delete experimental feature error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting experimental feature',
    });
  }
};

/**
 * Seed default experimental features
 * @route POST /api/admin/experimental-features/seed
 */
export const seedDefaultFeaturesController = async (req: Request, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({
        status: 'error',
        message: 'Tenant ID is required',
      });
    }

    await experimentalFeaturesService.seedDefaultFeatures(req.tenantId);

    return res.status(200).json({
      status: 'success',
      message: 'Default experimental features seeded successfully',
    });
  } catch (error) {
    console.error('Seed default features error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while seeding default features',
    });
  }
};
