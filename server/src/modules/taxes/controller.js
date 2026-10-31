import * as taxService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getTaxes = async (req, res) => {
  try {
    const { isActive } = req.query;
    const taxes = await taxService.listTaxes({ isActive });
    return sendSuccess(res, 'Taxes retrieved successfully', taxes);
  } catch (err) {
    console.error('Error fetching taxes:', err);
    return sendError(res, err.message || 'Failed to fetch taxes', 500);
  }
};

export const createTax = async (req, res) => {
  try {
    const { name, rate, isActive } = req.body;
    if (!name || rate === undefined) {
      return sendError(res, 'Tax name and rate are required', 400);
    }

    const tax = await taxService.createTax({ name, rate, isActive });
    return sendSuccess(res, 'Tax created successfully', tax, 201);
  } catch (err) {
    console.error('Error creating tax:', err);
    return sendError(res, err.message || 'Failed to create tax', 400);
  }
};

export const updateTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rate !== undefined) updateData.rate = rate;
    if (isActive !== undefined) updateData.is_active = isActive;

    const tax = await taxService.updateTax(id, updateData);
    return sendSuccess(res, 'Tax updated successfully', tax);
  } catch (err) {
    console.error('Error updating tax:', err);
    return sendError(res, err.message || 'Failed to update tax', 400);
  }
};
