import { Router } from 'express';
import { sendError } from '../../utils/apiResponse.js';

const router = Router();

// Placeholder for Member 2's subscriptions module
router.all('*', (req, res) => {
  return sendError(res, 'Subscriptions module is currently being developed by Member 2.', 501);
});

export default router;
