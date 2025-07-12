import { Router } from 'express';
import {
  getSystemStatusController,
  getSystemActivitiesController,
  getMaintenanceInfoController,
  triggerDatabaseBackupController,
  clearCacheController,
  getComplianceOverviewController,
  getComplianceViolationsController,
  getPolicyComplianceController,
  getExperimentalFeaturesController,
  createExperimentalFeatureController,
  updateExperimentalFeatureController,
  toggleExperimentalFeatureController,
  deleteExperimentalFeatureController,
  seedDefaultFeaturesController
} from '../controllers/admin.controller';
import { authenticate, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply admin restriction to all routes
router.use(restrictTo(['ADMIN']));

/**
 * @route GET /api/admin/system-status
 * @desc Get system status
 * @access Private (Admin only)
 */
router.get('/system-status', getSystemStatusController);

/**
 * @route GET /api/admin/system-activities
 * @desc Get recent system activities
 * @access Private (Admin only)
 */
router.get('/system-activities', getSystemActivitiesController);

/**
 * @route GET /api/admin/maintenance-info
 * @desc Get maintenance information
 * @access Private (Admin only)
 */
router.get('/maintenance-info', getMaintenanceInfoController);

/**
 * @route POST /api/admin/database-backup
 * @desc Trigger database backup
 * @access Private (Admin only)
 */
router.post('/database-backup', triggerDatabaseBackupController);

/**
 * @route POST /api/admin/clear-cache
 * @desc Clear system cache
 * @access Private (Admin only)
 */
router.post('/clear-cache', clearCacheController);

/**
 * @route GET /api/admin/compliance-overview
 * @desc Get compliance overview
 * @access Private (Admin only)
 */
router.get('/compliance-overview', getComplianceOverviewController);

/**
 * @route GET /api/admin/compliance-violations
 * @desc Get compliance violations
 * @access Private (Admin only)
 */
router.get('/compliance-violations', getComplianceViolationsController);

/**
 * @route GET /api/admin/policy-compliance
 * @desc Get policy compliance status
 * @access Private (Admin only)
 */
router.get('/policy-compliance', getPolicyComplianceController);

/**
 * @route GET /api/admin/experimental-features
 * @desc Get all experimental features
 * @access Private (Admin only)
 */
router.get('/experimental-features', getExperimentalFeaturesController);

/**
 * @route POST /api/admin/experimental-features
 * @desc Create a new experimental feature
 * @access Private (Admin only)
 */
router.post('/experimental-features', createExperimentalFeatureController);

/**
 * @route PUT /api/admin/experimental-features/:id
 * @desc Update an experimental feature
 * @access Private (Admin only)
 */
router.put('/experimental-features/:id', updateExperimentalFeatureController);

/**
 * @route PATCH /api/admin/experimental-features/:id/toggle
 * @desc Toggle an experimental feature
 * @access Private (Admin only)
 */
router.patch('/experimental-features/:id/toggle', toggleExperimentalFeatureController);

/**
 * @route DELETE /api/admin/experimental-features/:id
 * @desc Delete an experimental feature
 * @access Private (Admin only)
 */
router.delete('/experimental-features/:id', deleteExperimentalFeatureController);

/**
 * @route POST /api/admin/experimental-features/seed
 * @desc Seed default experimental features
 * @access Private (Admin only)
 */
router.post('/experimental-features/seed', seedDefaultFeaturesController);

export default router;
