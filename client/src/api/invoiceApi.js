import api from './axios.js';
import { mockFallback } from './mockFallback.js';

export const invoiceApi = {
  getInvoices: async (params = {}) => {
    try {
      const res = await api.get('/invoices', { params });
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        return { success: true, ...mockFallback.getInvoices(params) };
      }
      throw err;
    }
  },

  getInvoiceById: async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.getInvoiceById(id);
        if (item) return { success: true, data: item };
      }
      throw err;
    }
  },

  confirmInvoice: async (id) => {
    try {
      const res = await api.post(`/invoices/${id}/confirm`);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.confirmInvoice(id);
        return { success: true, message: 'Invoice confirmed', data: item };
      }
      throw err;
    }
  },

  cancelInvoice: async (id) => {
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      return res.data;
    } catch (err) {
      if (err.status === 501 || err.status === 404) {
        const item = mockFallback.cancelInvoice(id);
        return { success: true, message: 'Invoice cancelled', data: item };
      }
      throw err;
    }
  },
};
