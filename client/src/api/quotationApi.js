import api from './axios.js';
import { mockFallback } from './mockFallback.js';

export const quotationApi = {
  getQuotations: async (params = {}) => {
    try {
      const res = await api.get('/quotations', { params });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        console.warn('Backend /quotations returned', err.status, '- using local store');
        return { success: true, ...mockFallback.getQuotations(params) };
      }
      throw err;
    }
  },

  getQuotationById: async (id) => {
    try {
      const res = await api.get(`/quotations/${id}`);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.getQuotationById(id);
        if (item) return { success: true, data: item };
      }
      throw err;
    }
  },

  createQuotation: async (payload, extraContext = {}) => {
    try {
      const res = await api.post('/quotations', payload);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.createQuotation(
          payload,
          extraContext.products,
          extraContext.customer,
          extraContext.plan
        );
        return { success: true, message: 'Quotation created', data: item };
      }
      throw err;
    }
  },

  updateQuotationStatus: async (id, status) => {
    try {
      const res = await api.patch(`/quotations/${id}/status`, { status });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.updateQuotationStatus(id, status);
        return { success: true, message: 'Status updated', data: item };
      }
      throw err;
    }
  },

  convertQuotation: async (id, payload = {}) => {
    try {
      const res = await api.post(`/quotations/${id}/convert`, payload);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.convertQuotation(id, payload);
        return { success: true, message: 'Converted to subscription', data: item };
      }
      throw err;
    }
  },
};
