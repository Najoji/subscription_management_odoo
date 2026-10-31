import { isValidDateString } from '../../utils/dateUtils.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUID = (id) => typeof id === 'string' && UUID_REGEX.test(id);

export const validateCreateSubscription = (body) => {
  const errors = [];

  if (!body.customerId) {
    errors.push('customerId is required.');
  } else if (!isValidUUID(body.customerId)) {
    errors.push('customerId must be a valid UUID.');
  }

  if (!body.planId) {
    errors.push('planId is required.');
  } else if (!isValidUUID(body.planId)) {
    errors.push('planId must be a valid UUID.');
  }

  if (!body.startDate) {
    errors.push('startDate is required (format: YYYY-MM-DD).');
  } else if (!isValidDateString(body.startDate)) {
    errors.push('startDate must be a valid date in YYYY-MM-DD format.');
  }

  if (body.expiryDate && !isValidDateString(body.expiryDate)) {
    errors.push('expiryDate must be a valid date in YYYY-MM-DD format.');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Subscription must contain at least one item.');
  } else {
    body.items.forEach((item, index) => {
      if (!item.productId || !isValidUUID(item.productId)) {
        errors.push(`Item at index ${index} must have a valid productId UUID.`);
      }
      if (item.variantId && !isValidUUID(item.variantId)) {
        errors.push(`Item at index ${index} has an invalid variantId UUID.`);
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        errors.push(`Item at index ${index} must have a positive integer quantity.`);
      }
    });
  }

  return errors;
};

export const validateUpdateSubscriptionStatus = (body) => {
  const errors = [];
  const allowed = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'];

  if (!body.status) {
    errors.push('status is required.');
  } else if (!allowed.includes(body.status)) {
    errors.push(`status must be one of: ${allowed.join(', ')}.`);
  }

  return errors;
};

export const validateRenewSubscription = (body) => {
  const errors = [];

  if (body.newExpiryDate && !isValidDateString(body.newExpiryDate)) {
    errors.push('newExpiryDate must be a valid date in YYYY-MM-DD format.');
  }

  return errors;
};
