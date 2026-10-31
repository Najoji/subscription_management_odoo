import api from './axios.js';

export const authApi = {
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data;
  },

  createStaff: async (payload) => {
    const res = await api.post('/users/staff', payload);
    return res.data;
  },

  getCustomers: async (params = {}) => {
    const res = await api.get('/users/customers', { params });
    return res.data;
  },
};
