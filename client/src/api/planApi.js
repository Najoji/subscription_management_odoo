import api from './axios.js';

export const planApi = {
  getPlans: async (params = {}) => {
    const res = await api.get('/plans', { params });
    return res.data;
  },

  getPlanById: async (id) => {
    const res = await api.get(`/plans/${id}`);
    return res.data;
  },

  createPlan: async (payload) => {
    const res = await api.post('/plans', payload);
    return res.data;
  },

  updatePlan: async (id, payload) => {
    const res = await api.patch(`/plans/${id}`, payload);
    return res.data;
  },
};
