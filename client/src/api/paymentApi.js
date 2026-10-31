import api from './axios.js';
import { mockFallback } from './mockFallback.js';

export const paymentApi = {
  getPayments: async (params = {}) => {
    try {
      const res = await api.get('/payments', { params });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
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
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.recordPayment(invoiceId, payload, staffUser);
        return { success: true, message: 'Payment recorded successfully', data: item };
      }
      throw err;
    }
  },
};
