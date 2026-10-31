import { Router } from 'express';
import { sendError } from '../../utils/apiResponse.js';

const router = Router();

// Placeholder for Member 3's discounts module
router.all('*', (req, res) => {
  return sendError(res, 'Discounts module is currently being developed by Member 3.', 501);
});

export default router;
