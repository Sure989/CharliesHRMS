import { processSalaryAdvanceRequest } from '../services/salaryAdvance.service';
/**
 * Update salary advance request (approve/reject/status update)
 * @route PATCH /api/salary-advances/:id
 */
export const updateSalaryAdvanceRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user;
    const requestId = req.params.id;
    if (!tenantId || !user?.userId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID and userId are required' });
    }
    const { status, approverId, approvedAmount, rejectionReason, comments } = req.body;
    if (!status || !['APPROVED', 'REJECTED', 'FORWARDEDTOHR'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Status must be APPROVED, REJECTED, or FORWARDEDTOHR' });
    }
    const decision = status;
    const processedBy = approverId || user.userId;
    const data: any = { approvedAmount, rejectionReason, comments };
    const updated = await processSalaryAdvanceRequest(requestId, tenantId, decision, processedBy, data);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (error: any) {
    console.error('Update salary advance request error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to update salary advance request' });
  }
};
import { createSalaryAdvanceRequest as createSalaryAdvanceRequestService } from '../services/salaryAdvance.service';
import { prisma } from '../index';

/**
 * Create a new salary advance request
 * @route POST /api/salary-advances
 */
export const createSalaryAdvanceRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user;
    if (!tenantId || !user?.userId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID and userId are required' });
    }
    // Look up employeeId from User record
    const userRecord = await prisma.user.findFirst({
      where: { id: user.userId, tenantId },
      select: { employeeId: true },
    });
    if (!userRecord?.employeeId) {
      return res.status(404).json({ status: 'error', message: 'No employee record found for this user' });
    }
    const { requestedAmount, reason, attachments } = req.body;
    if (typeof requestedAmount !== 'number' || !reason) {
      return res.status(400).json({ status: 'error', message: 'requestedAmount (number) and reason (string) are required' });
    }
    const request = await createSalaryAdvanceRequestService(userRecord.employeeId, tenantId, { requestedAmount, reason, attachments });
    return res.status(201).json({ status: 'success', data: request });
  } catch (error: any) {
    console.error('Create salary advance request error:', error);
    return res.status(400).json({ status: 'error', message: error.message || 'Failed to create salary advance request' });
  }
};
import { Request, Response } from 'express';
import { getSalaryAdvanceRequests as getSalaryAdvanceRequestsService } from '../services/salaryAdvance.service';

/**
 * Get salary advance requests with optional filters
 * @route GET /api/salary-advances
 */
export const getSalaryAdvanceRequests = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    console.log('[HRMS][GET /api/salary-advances] tenantId:', tenantId);
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Collect filters from query params (exclude tenantId)
    // eslint-disable-next-line no-unused-vars
    const { tenantId: _omit, ...filters } = req.query;
    
    // Add user role and ID for branch filtering
    const enhancedFilters = {
      ...filters,
      userRole: req.user?.role,
      userId: req.user?.userId
    };
    
    console.log('[HRMS][GET /api/salary-advances] filters:', enhancedFilters);
    const data = await getSalaryAdvanceRequestsService(tenantId, enhancedFilters);
    console.log('[HRMS][GET /api/salary-advances] result count:', Array.isArray(data?.requests) ? data.requests.length : 'n/a');
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Get salary advance requests error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching salary advance requests' });
  }
};
