import axios from 'axios';
import * as Sentry from '@sentry/nextjs';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    Sentry.captureException(error);

    const safeLog = {
      url: error?.config?.url || '-',
      method: error?.config?.method || '-',
      status: error?.response?.status || '-',
      data: error?.response?.data || '-',
      message: error?.message || '-',
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', safeLog);
    }

    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
