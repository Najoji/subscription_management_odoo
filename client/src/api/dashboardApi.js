import api from './axios.js';
import { mockFallback } from './mockFallback.js';

export const dashboardApi = {
  getSummary: async () => {
    try {
      const res = await api.get('/dashboard/summary');
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        return { success: true, data: mockFallback.getDashboardSummary() };
      }
      throw err;
    }
  },
};
