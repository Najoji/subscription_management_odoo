import api from './axios.js';
import { mockFallback } from './mockFallback.js';
import { MOCK_MODE_ENABLED } from './mockMode.js';

export const subscriptionApi = {
  getSubscriptions: async (params = {}) => {
    try {
      const res = await api.get('/subscriptions', { params });
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
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
      if (MOCK_MODE_ENABLED && err.status === 501) {
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
      if (MOCK_MODE_ENABLED && err.status === 501) {
        const item = mockFallback.updateSubscriptionStatus(id, status);
        return { success: true, message: `Status updated to ${status}`, data: item };
      }
      throw err;
    }
  },
};
