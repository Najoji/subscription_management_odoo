import api from './axios.js';
import { mockFallback } from './mockFallback.js';

export const billingApi = {
  runBilling: async (asOfDate) => {
    try {
      const res = await api.post('/billing/run', { asOfDate });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
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
