
import axios from 'axios';

const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('salonflow_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired access tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('salonflow_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const newAccess = res.data.access_token;
          const newRefresh = res.data.refresh_token;

          localStorage.setItem('salonflow_access_token', newAccess);
          localStorage.setItem('salonflow_refresh_token', newRefresh);

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('salonflow_access_token');
          localStorage.removeItem('salonflow_refresh_token');
          localStorage.removeItem('salonflow_user');

          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
