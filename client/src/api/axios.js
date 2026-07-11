import axios from 'axios';

const getBaseURL = () => {
  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanUrl = rawUrl.replace(/\/$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handling — clear storage and reload to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hf_token');
      localStorage.removeItem('hf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
