import * as userService from './service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getUsers = async (req, res) => {
  try {
    const { role, search, page, limit } = req.query;
    const result = await userService.listUsers({ role, search, page, limit });
    return sendSuccess(res, 'Users retrieved successfully', result.users, 200, result.pagination);
  } catch (err) {
    console.error('Error fetching users:', err);
    return sendError(res, err.message || 'Failed to fetch users', 500);
  }
};

export const createStaff = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password || !fullName) {
      return sendError(res, 'Email, password, and fullName are required', 400);
    }

    const staffProfile = await userService.createStaffUser({ email, password, fullName, phone });
    return sendSuccess(res, 'Staff member created successfully', staffProfile, 201);
  } catch (err) {
    console.error('Error creating staff:', err);
    return sendError(res, err.message || 'Failed to create staff member', 400);
  }
};

export const getCustomers = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await userService.listCustomers({ search, page, limit });
    return sendSuccess(res, 'Customers retrieved successfully', result.users, 200, result.pagination);
  } catch (err) {
    console.error('Error fetching customers:', err);
    return sendError(res, err.message || 'Failed to fetch customers', 500);
  }
};
