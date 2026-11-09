import axios from 'axios';

/**
 * Real backend client. No credentials or secrets are stored here.
 * A session token, when a real backend exists, is injected at request time
 * and authorization is enforced server-side, never by this file.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('spf.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => Promise.reject({
    status: error.response?.status ?? 0,
    message: error.response?.data?.message || error.message || 'Network request failed.',
  }),
);

export const isBackendConfigured = () => Boolean(import.meta.env.VITE_API_BASE_URL);
export default api;
