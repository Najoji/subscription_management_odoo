import * as discountService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const listDiscounts = async (req, res) => {
  try {
    const { isActive, search, page, limit } = req.query;
    const result = await discountService.listDiscounts({ isActive, search, page, limit });
    return sendSuccess(res, 'Discounts retrieved successfully', result.discounts, 200, result.pagination);
  } catch (err) {
    console.error('Error fetching discounts:', err);
    return sendError(res, err.message || 'Failed to fetch discounts', 500);
  }
};

export const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await discountService.getDiscountById(id);
    return sendSuccess(res, 'Discount retrieved successfully', discount);
  } catch (err) {
    console.error('Error fetching discount by id:', err);
    return sendError(res, err.message || 'Discount not found', 404);
  }
};

export const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);
    return sendSuccess(res, 'Discount created successfully', discount, 201);
  } catch (err) {
    console.error('Error creating discount:', err);
    return sendError(res, err.message || 'Failed to create discount', 400);
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await discountService.updateDiscount(id, req.body);
    return sendSuccess(res, 'Discount updated successfully', discount);
  } catch (err) {
    console.error('Error updating discount:', err);
    return sendError(res, err.message || 'Failed to update discount', 400);
  }
};

export const validateDiscount = async (req, res) => {
  try {
    const { discountId, code, subtotal, quantity, targetType, asOfDate } = req.body;
    const result = await discountService.validateDiscount({
      discountId,
      code,
      subtotal,
      quantity,
      targetType,
      asOfDate,
    });

    if (!result.isValid) {
      return sendError(res, result.reason || 'Discount is not applicable', 400, [result]);
    }

    return sendSuccess(res, 'Discount is valid and eligible', result);
  } catch (err) {
    console.error('Error validating discount:', err);
    return sendError(res, err.message || 'Failed to validate discount', 400);
  }
};
