import api from './axios.js';
import { mockFallback } from './mockFallback.js';
import { MOCK_MODE_ENABLED } from './mockMode.js';

export const discountApi = {
  getDiscounts: async (params = {}) => {
    try {
      const res = await api.get('/discounts', { params });
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
        return { success: true, ...mockFallback.getDiscounts() };
      }
      throw err;
    }
  },

  createDiscount: async (payload) => {
    try {
      const res = await api.post('/discounts', payload);
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
        const item = mockFallback.createDiscount(payload);
        return { success: true, message: 'Discount created', data: item };
      }
      throw err;
    }
  },

  updateDiscount: async (id, payload) => {
    const res = await api.patch(`/discounts/${id}`, payload);
    return res.data;
  },
};
