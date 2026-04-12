import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly cookie on every request
});

// Auth routes where we should NOT trigger the 401 → logout flow
const AUTH_PATHS = ['/auth/login', '/auth/logout', '/auth/register'];

let loggingOut = false;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthRoute = AUTH_PATHS.some((p) => url.includes(p));

    if (error.response?.status === 401 && !isAuthRoute && !loggingOut) {
      loggingOut = true;
      // Clear cookie server-side — fire and forget
      try { await api.post('/auth/logout'); } catch { /* ignore */ }
      // Clear persisted auth state so RequireAuth redirects to login on next render
      localStorage.removeItem('nest_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
