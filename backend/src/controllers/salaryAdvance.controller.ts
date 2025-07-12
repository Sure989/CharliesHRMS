import { Request, Response } from 'express';
import { getSalaryAdvanceRequests as getSalaryAdvanceRequestsService } from '../services/salaryAdvance.service';

/**
 * Get salary advance requests with optional filters
 * @route GET /api/salary-advances
 */
export const getSalaryAdvanceRequests = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ status: 'error', message: 'Tenant ID is required' });
    }
    // Collect filters from query params (exclude tenantId)
    const { tenantId: _omit, ...filters } = req.query;
    const data = await getSalaryAdvanceRequestsService(tenantId, filters);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Get salary advance requests error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while fetching salary advance requests' });
  }
};
