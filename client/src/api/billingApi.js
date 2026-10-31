import api from './axios.js';
import { mockFallback } from './mockFallback.js';
import { MOCK_MODE_ENABLED } from './mockMode.js';

export const billingApi = {
  runBilling: async (asOfDate) => {
    try {
      const res = await api.post('/billing/run', { asOfDate });
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
        const result = mockFallback.runBilling(asOfDate);
        return {
          success: true,
          message: 'Billing run completed (local store)',
          data: result,
        };
      }
      throw err;
    }
  },
};
