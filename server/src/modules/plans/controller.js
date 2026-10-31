import * as planService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getPlans = async (req, res) => {
  try {
    const { search, isActive, billingInterval, page, limit } = req.query;
    const result = await planService.listPlans({ search, isActive, billingInterval, page, limit });
    return sendSuccess(res, 'Plans retrieved successfully', result.plans, 200, result.pagination);
  } catch (err) {
    console.error('Error fetching plans:', err);
    return sendError(res, err.message || 'Failed to fetch plans', 500);
  }
};

export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await planService.getPlanById(id);
    return sendSuccess(res, 'Plan retrieved successfully', plan);
  } catch (err) {
    console.error('Error fetching plan:', err);
    return sendError(res, err.message || 'Failed to fetch plan', 404);
  }
};

export const createPlan = async (req, res) => {
  try {
    const plan = await planService.createPlan(req.body);
    return sendSuccess(res, 'Plan created successfully', plan, 201);
  } catch (err) {
    console.error('Error creating plan:', err);
    return sendError(res, err.message || 'Failed to create plan', 400);
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await planService.updatePlan(id, req.body);
    return sendSuccess(res, 'Plan updated successfully', plan);
  } catch (err) {
    console.error('Error updating plan:', err);
    return sendError(res, err.message || 'Failed to update plan', 400);
  }
};
