import * as dashboardService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await dashboardService.getDashboardSummary({ startDate, endDate });
    return sendSuccess(res, 'Dashboard summary retrieved successfully', summary);
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    return sendError(res, err.message || 'Failed to fetch dashboard summary', 500);
  }
};
