import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly cookie on every request
});

api.interceptors.request.use((config) => {
  // Fallback: if token is in Zustand store (dev / mobile), attach as Bearer header.
  // In production the httpOnly cookie is used automatically — no JS access needed.
  try {
    const stored = localStorage.getItem('nest_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      // Call logout to clear cookie server-side, then redirect
      try { await api.post('/auth/logout'); } catch { /* ignore */ }
      // Clear local auth state
      localStorage.removeItem('nest_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
