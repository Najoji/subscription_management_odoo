import { isValidDateString } from '../../utils/dateUtils.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (id) => typeof id === 'string' && UUID_REGEX.test(id);

export const validateCreateQuotation = (body, userRole) => {
  const errors = [];

  if (userRole !== 'customer') {
    if (!body.customerId) {
      errors.push('customerId is required.');
    } else if (!isValidUUID(body.customerId)) {
      errors.push('customerId must be a valid UUID.');
    }
  }

  if (body.planId && !isValidUUID(body.planId)) {
    errors.push('planId must be a valid UUID.');
  }

  if (body.templateId && !isValidUUID(body.templateId)) {
    errors.push('templateId must be a valid UUID.');
  }

  if (body.discountId && !isValidUUID(body.discountId)) {
    errors.push('discountId must be a valid UUID.');
  }

  if (!body.validUntil) {
    errors.push('validUntil is required (format: YYYY-MM-DD).');
  } else if (!isValidDateString(body.validUntil)) {
    errors.push('validUntil must be a valid date string in YYYY-MM-DD format.');
  }

  const hasItems = Array.isArray(body.items) && body.items.length > 0;
  if (!hasItems && !body.templateId) {
    errors.push('Quotation must contain at least one item or specify a templateId.');
  }

  if (hasItems) {
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

export const validateUpdateQuotationStatus = (body) => {
  const errors = [];
  const allowedStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

  if (!body.status) {
    errors.push('status is required.');
  } else if (!allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(', ')}. Use /convert to convert to a subscription.`);
  }

  return errors;
};

export const validateConvertQuotation = (body) => {
  const errors = [];

  if (body.planId && !isValidUUID(body.planId)) {
    errors.push('planId must be a valid UUID.');
  }

  if (body.startDate && !isValidDateString(body.startDate)) {
    errors.push('startDate must be a valid date string in YYYY-MM-DD format.');
  }

  if (body.expiryDate && !isValidDateString(body.expiryDate)) {
    errors.push('expiryDate must be a valid date string in YYYY-MM-DD format.');
  }

  return errors;
};

export const validateCreateTemplate = (body) => {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must not be empty.');
  }

  if (body.planId && !isValidUUID(body.planId)) {
    errors.push('planId must be a valid UUID.');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Template must have at least one item.');
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
