import api from './axios.js';
import { mockFallback } from './mockFallback.js';
import { MOCK_MODE_ENABLED } from './mockMode.js';

export const invoiceApi = {
  getInvoices: async (params = {}) => {
    try {
      const res = await api.get('/invoices', { params });
      return res.data;
    } catch (err) {
      if (MOCK_MODE_ENABLED && err.status === 501) {
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
      if (MOCK_MODE_ENABLED && err.status === 501) {
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
      if (MOCK_MODE_ENABLED && err.status === 501) {
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
      if (MOCK_MODE_ENABLED && err.status === 501) {
        const item = mockFallback.cancelInvoice(id);
        return { success: true, message: 'Invoice cancelled', data: item };
      }
      throw err;
    }
  },

  downloadPdf: async (id, invoiceNumber) => {
    const res = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeNumber = (invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Invoice-${safeNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },
};
