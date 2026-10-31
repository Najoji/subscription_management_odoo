import axios from 'axios';
import { supabase } from './supabase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Supabase JWT Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.error('Failed to attach Supabase auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('brightloop_local_profile');
    }
    const errorMsg = error.response?.data?.message || error.message || 'API request failed';
    const customError = new Error(errorMsg);
    customError.response = error.response;
    customError.status = error.response?.status;
    customError.errors = error.response?.data?.errors || [];
    return Promise.reject(customError);
  }
);

export default api;
