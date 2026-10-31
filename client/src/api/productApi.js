import api from './axios.js';

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (payload) => {
    const res = await api.post('/products', payload);
    return res.data;
  },

  updateProduct: async (id, payload) => {
    const res = await api.patch(`/products/${id}`, payload);
    return res.data;
  },

  addVariant: async (productId, payload) => {
    const res = await api.post(`/products/${productId}/variants`, payload);
    return res.data;
  },

  calculatePrice: async (params) => {
    const res = await api.get('/products/calculate-price', { params });
    return res.data;
  },
};
