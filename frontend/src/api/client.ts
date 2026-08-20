import axios from 'axios';
import { useAuthStore } from '../store';

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly cookie on every request (fallback strategy)
});

// Auth routes where we should NOT trigger the 401 → logout flow
const AUTH_PATHS = ['/auth/login', '/auth/logout', '/auth/register'];

let loggingOut = false;

// Request interceptor: always attach the bearer token. In production the
// frontend (Vercel) and backend (Render) are on different domains, so the
// httpOnly cookie can be dropped — by Safari/iTP, by strict privacy settings,
// or by request-mangling browser extensions. The Authorization header is the
// reliable fallback, so we source the token from the store AND, if that's
// empty (e.g. store not yet rehydrated after a reload), directly from
// localStorage. Without this a valid owner can get a 403 on writes.
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token =
      useAuthStore.getState().token ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('nest_token') : null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
