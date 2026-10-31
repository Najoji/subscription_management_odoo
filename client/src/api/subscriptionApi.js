import api from './axios.js';
import { mockFallback } from './mockFallback.js';

export const subscriptionApi = {
  getSubscriptions: async (params = {}) => {
    try {
      const res = await api.get('/subscriptions', { params });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        return { success: true, ...mockFallback.getSubscriptions(params) };
      }
      throw err;
    }
  },

  getSubscriptionById: async (id) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.getSubscriptionById(id);
        if (item) return { success: true, data: item };
      }
      throw err;
    }
  },

  updateSubscriptionStatus: async (id, status) => {
    try {
      const res = await api.patch(`/subscriptions/${id}/status`, { status });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.updateSubscriptionStatus(id, status);
        return { success: true, message: `Status updated to ${status}`, data: item };
      }
      throw err;
    }
  },
};
