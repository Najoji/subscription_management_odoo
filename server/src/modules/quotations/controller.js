import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import * as quotationService from './service.js';
import {
  validateCreateQuotation,
  validateUpdateQuotationStatus,
  validateConvertQuotation,
  validateCreateTemplate,
} from './validation.js';

/**
 * GET /api/quotations
 */
export const listQuotations = async (req, res) => {
  try {
    const { page, limit, status, customerId, search, startDate, endDate } = req.query;
    const result = await quotationService.listQuotations({
      user: req.user,
      search,
      status,
      customerId,
      page,
      limit,
      startDate,
      endDate,
    });

    return sendSuccess(res, 'Quotations retrieved successfully', result.quotations, 200, result.pagination);
  } catch (error) {
    console.error('Error listing quotations:', error);
    return sendError(res, error.message || 'Failed to list quotations', error.statusCode || 500);
  }
};

/**
 * GET /api/quotations/:id
 */
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id, req.user);
    return sendSuccess(res, 'Quotation retrieved successfully', quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return sendError(res, error.message || 'Failed to fetch quotation', error.statusCode || 500);
  }
};

/**
 * POST /api/quotations
 */
export const createQuotation = async (req, res) => {
  try {
    const errors = validateCreateQuotation(req.body, req.user.role);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for quotation creation', 400, errors);
    }

    const quotation = await quotationService.createQuotation(req.body, req.user);
    return sendSuccess(res, 'Quotation created successfully', quotation, 201);
  } catch (error) {
    console.error('Error creating quotation:', error);
    return sendError(res, error.message || 'Failed to create quotation', error.statusCode || 500);
  }
};

/**
 * PATCH /api/quotations/:id/status
 */
export const updateQuotationStatus = async (req, res) => {
  try {
    const errors = validateUpdateQuotationStatus(req.body);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for status update', 400, errors);
    }

    const quotation = await quotationService.updateQuotationStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    return sendSuccess(res, `Quotation status updated to ${req.body.status}`, quotation);
  } catch (error) {
    console.error('Error updating quotation status:', error);
    return sendError(res, error.message || 'Failed to update quotation status', error.statusCode || 500);
  }
};

/**
 * POST /api/quotations/:id/convert
 */
export const convertQuotation = async (req, res) => {
  try {
    const errors = validateConvertQuotation(req.body);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for quotation conversion', 400, errors);
    }

    const subscription = await quotationService.convertQuotationToSubscription(
      req.params.id,
      req.body,
      req.user
    );
    return sendSuccess(res, 'Quotation successfully converted to subscription', subscription, 201);
  } catch (error) {
    console.error('Error converting quotation:', error);
    return sendError(res, error.message || 'Failed to convert quotation to subscription', error.statusCode || 500);
  }
};

/**
 * GET /api/quotations/templates
 */
export const listTemplates = async (req, res) => {
  try {
    const templates = await quotationService.listTemplates();
    return sendSuccess(res, 'Quotation templates retrieved successfully', templates);
  } catch (error) {
    console.error('Error listing templates:', error);
    return sendError(res, error.message || 'Failed to list quotation templates', error.statusCode || 500);
  }
};

/**
 * GET /api/quotations/templates/:id
 */
export const getTemplateById = async (req, res) => {
  try {
    const template = await quotationService.getTemplateById(req.params.id);
    return sendSuccess(res, 'Quotation template retrieved successfully', template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return sendError(res, error.message || 'Failed to fetch quotation template', error.statusCode || 500);
  }
};

/**
 * POST /api/quotations/templates
 */
export const createTemplate = async (req, res) => {
  try {
    const errors = validateCreateTemplate(req.body);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for template creation', 400, errors);
    }

    const template = await quotationService.createTemplate(req.body, req.user);
    return sendSuccess(res, 'Quotation template created successfully', template, 201);
  } catch (error) {
    console.error('Error creating template:', error);
    return sendError(res, error.message || 'Failed to create quotation template', error.statusCode || 500);
  }
};

/**
 * DELETE /api/quotations/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    await quotationService.deleteTemplate(req.params.id);
    return sendSuccess(res, 'Quotation template deleted successfully');
  } catch (error) {
    console.error('Error deleting template:', error);
    return sendError(res, error.message || 'Failed to delete template', error.statusCode || 500);
  }
};
