import * as billingEngine from './billingEngine.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const runBilling = async (req, res) => {
  try {
    const { asOfDate, subscriptionId } = req.body || {};
    const result = await billingEngine.runBillingEngine({
      asOfDate,
      specificSubscriptionId: subscriptionId,
    });

    return sendSuccess(res, 'Billing run completed successfully', result);
  } catch (err) {
    console.error('Error executing billing run:', err);
    return sendError(res, err.message || 'Billing run failed', 500);
  }
};
