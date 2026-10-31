import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import * as subscriptionService from './service.js';
import {
  validateCreateSubscription,
  validateUpdateSubscriptionStatus,
  validateRenewSubscription,
} from './validation.js';

/**
 * GET /api/subscriptions
 */
export const listSubscriptions = async (req, res) => {
  try {
    const { page, limit, status, customerId, planId, search, startDate, expiryDate } = req.query;
    const result = await subscriptionService.listSubscriptions({
      user: req.user,
      search,
      status,
      customerId,
      planId,
      page,
      limit,
      startDate,
      expiryDate,
    });

    return sendSuccess(res, 'Subscriptions retrieved successfully', result.subscriptions, 200, result.pagination);
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    return sendError(res, error.message || 'Failed to list subscriptions', error.statusCode || 500);
  }
};

/**
 * GET /api/subscriptions/:id
 */
export const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
    return sendSuccess(res, 'Subscription retrieved successfully', subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return sendError(res, error.message || 'Failed to fetch subscription', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions
 */
export const createSubscription = async (req, res) => {
  try {
    const errors = validateCreateSubscription(req.body);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for subscription creation', 400, errors);
    }

    const subscription = await subscriptionService.createSubscriptionDirectly(req.body, req.user);
    return sendSuccess(res, 'Subscription created successfully', subscription, 201);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return sendError(res, error.message || 'Failed to create subscription', error.statusCode || 500);
  }
};

/**
 * PATCH /api/subscriptions/:id/status
 */
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const errors = validateUpdateSubscriptionStatus(req.body);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for status update', 400, errors);
    }

    const subscription = await subscriptionService.updateSubscriptionStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    return sendSuccess(res, `Subscription status updated to ${req.body.status}`, subscription);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return sendError(res, error.message || 'Failed to update subscription status', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions/:id/confirm
 */
export const confirmSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.confirmSubscription(req.params.id, req.user);
    return sendSuccess(res, 'Subscription confirmed successfully', subscription);
  } catch (error) {
    console.error('Error confirming subscription:', error);
    return sendError(res, error.message || 'Failed to confirm subscription', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions/:id/activate
 */
export const activateSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.activateSubscription(req.params.id, req.user);
    return sendSuccess(res, 'Subscription activated successfully', subscription);
  } catch (error) {
    console.error('Error activating subscription:', error);
    return sendError(res, error.message || 'Failed to activate subscription', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions/:id/pause
 */
export const pauseSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.pauseSubscription(req.params.id, req.user);
    return sendSuccess(res, 'Subscription paused successfully', subscription);
  } catch (error) {
    console.error('Error pausing subscription:', error);
    return sendError(res, error.message || 'Failed to pause subscription', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions/:id/resume
 */
export const resumeSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.resumeSubscription(req.params.id, req.user);
    return sendSuccess(res, 'Subscription resumed successfully', subscription);
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return sendError(res, error.message || 'Failed to resume subscription', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions/:id/close
 */
export const closeSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.closeSubscription(req.params.id, req.user);
    return sendSuccess(res, 'Subscription closed successfully', subscription);
  } catch (error) {
    console.error('Error closing subscription:', error);
    return sendError(res, error.message || 'Failed to close subscription', error.statusCode || 500);
  }
};

/**
 * POST /api/subscriptions/:id/renew
 */
export const renewSubscription = async (req, res) => {
  try {
    const errors = validateRenewSubscription(req.body);
    if (errors.length > 0) {
      return sendError(res, 'Validation failed for subscription renewal', 400, errors);
    }

    const subscription = await subscriptionService.renewSubscription(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Subscription renewed successfully', subscription);
  } catch (error) {
    console.error('Error renewing subscription:', error);
    return sendError(res, error.message || 'Failed to renew subscription', error.statusCode || 500);
  }
};
