import axios from 'axios';

/**
 * Core HTTP client for the LUMORA FastAPI backend (Axios).
 *
 * - Base URL and timeout come from environment variables (see .env.example).
 * - Attaches the JWT as `Authorization: Bearer <token>`.
 * - Normalises every failure into an ApiError with a friendly message,
 *   so pages can simply `catch (err) { toast.error('…', err.message) }`.
 *
 * UI components never import this file directly — they go through the
 * services in this folder, which switch between mock data and the real API.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
export const USE_MOCK_DATA = String(import.meta.env.VITE_USE_MOCK_DATA ?? 'true') === 'true';
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

/* ── Token storage ───────────────────────────────────────────
   "Remember me" keeps the session in localStorage; otherwise it lives
   in sessionStorage and ends when the browser closes. */
const TOKEN_KEY = 'lumora:token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  set: (token, remember = true) => {
    tokenStorage.clear();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function friendlyMessage(status, data) {
  // FastAPI: { detail: "..." } or { detail: [{ msg, loc }] } for validation errors
  const detail = data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (detail?.message) return detail.message;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You don’t have permission to do that.';
  if (status === 404) return 'We couldn’t find what you were looking for.';
  if (status === 409) return 'That already exists.';
  if (status === 422) return 'Some details look incorrect. Please check and try again.';
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return 'Something went wrong. Please try again.';
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('The request took too long. Check your connection and try again.'));
    }
    if (!error.response) {
      return Promise.reject(new ApiError('Can’t reach the LUMORA server. Is the backend running?'));
    }
    const { status, data } = error.response;
    if (status === 401) tokenStorage.clear();
    const code = typeof data?.detail === 'object' ? data.detail.code : null;
    return Promise.reject(new ApiError(friendlyMessage(status, data), { status, code, data }));
  },
);

/** Thin helpers so services read cleanly: api.get('/profile'), api.post('/auth/login', body) */
export const api = {
  get: (url, config) => http.get(url, config),
  post: (url, body, config) => http.post(url, body, config),
  put: (url, body, config) => http.put(url, body, config),
  patch: (url, body, config) => http.patch(url, body, config),
  delete: (url, config) => http.delete(url, config),
};

/** Simulated network delay for mock responses, so loading states are visible. */
export const mockDelay = (data, ms = 700) =>
  new Promise((resolve) => setTimeout(() => resolve(data === undefined ? data : structuredClone(data)), ms));

/** Simulated failure after a delay (mock mode only). */
export const mockReject = (message, options, ms = 700) =>
  new Promise((_, reject) => setTimeout(() => reject(new ApiError(message, options)), ms));
