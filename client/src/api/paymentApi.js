import api from './axios.js';
import { mockFallback } from './mockFallback.js';
import { MOCK_MODE_ENABLED } from './mockMode.js';

export const paymentApi = {
  getPayments: async (params = {}) => {
    try {
      const res = await api.get('/payments', { params });
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
        return { success: true, ...mockFallback.getPayments(params) };
      }
      throw err;
    }
  },

  recordPayment: async (invoiceId, payload, staffUser = null) => {
    try {
      const res = await api.post(`/invoices/${invoiceId}/payments`, payload);
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
        const item = mockFallback.recordPayment(invoiceId, payload, staffUser);
        return { success: true, message: 'Payment recorded successfully', data: item };
      }
      throw err;
    }
  },
};
