import api from './axios.js';

export const taxApi = {
  getTaxes: async (params = {}) => {
    const res = await api.get('/taxes', { params });
    return res.data;
  },

  createTax: async (payload) => {
    const res = await api.post('/taxes', payload);
    return res.data;
  },
};
