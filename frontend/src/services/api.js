import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('salonflow_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('salonflow_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          const newAccess = res.data.access_token;
          const newRefresh = res.data.refresh_token;
          localStorage.setItem('salonflow_access_token', newAccess);
          localStorage.setItem('salonflow_refresh_token', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
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
