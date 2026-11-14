import { api, mockDelay, USE_MOCK_DATA } from './api';

/**
 * Contact & support messages.
 * Uses the existing POST /feedback endpoint with a `type` field,
 * so the backend needs no extra route:
 *   POST /feedback { type: "contact", name, email, subject, message } → { ok: true }
 */
export const supportService = {
  sendContactMessage(payload) {
    return USE_MOCK_DATA
      ? mockDelay({ ok: true }, 1000)
      : api.post('/feedback', { type: 'contact', ...payload }, { skipAuth: true });
  },
};
