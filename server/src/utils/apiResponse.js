/**
 * Standard API Response utilities adhering to Brightloop API Contracts.
 */

export const sendSuccess = (res, message = 'Operation successful', data = {}, statusCode = 200, pagination = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
