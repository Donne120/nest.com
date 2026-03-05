import axios from 'axios';

// In production (Render), set VITE_API_URL to your backend URL e.g. https://nest-api.onrender.com
// In development, leave unset — Vite proxies /api to localhost:8000
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nest_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nest_token');
      localStorage.removeItem('nest_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
