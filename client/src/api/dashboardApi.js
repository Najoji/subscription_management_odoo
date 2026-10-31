import api from './axios.js';
import { mockFallback } from './mockFallback.js';
import { MOCK_MODE_ENABLED } from './mockMode.js';

export const dashboardApi = {
  getSummary: async () => {
    try {
      const res = await api.get('/dashboard/summary');
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
        return { success: true, data: mockFallback.getDashboardSummary() };
      }
      throw err;
    }
  },
};
