import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();

/**
 * GET /api/auth/me
 * Returns current authenticated user and profile information.
 */
router.get('/me', authenticateUser, (req, res) => {
  return sendSuccess(res, 'User profile retrieved successfully', {
    id: req.user.id,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
    phone: req.user.phone,
    createdAt: req.user.profile.created_at,
  });
});

export default router;
