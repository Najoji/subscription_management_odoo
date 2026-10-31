import { sendError } from '../utils/apiResponse.js';

/**
 * Role-Based Access Control Middleware:
 * Ensures the authenticated user has one of the allowed roles.
 *
 * @param {...string} allowedRoles - 'admin', 'staff', 'customer'
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Access denied: Unauthenticated user', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied: Role '${req.user.role}' is not authorized for this action`,
        403
      );
    }

    next();
  };
};
