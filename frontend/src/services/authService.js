import { api, mockDelay, mockReject, tokenStorage, USE_MOCK_DATA } from './api';
import { DEMO_ACCOUNT, mockUser } from '../data/mockUser';

/**
 * Authentication service.
 *
 * Backend contract to agree with the FastAPI teammate:
 *   POST /auth/register         { name, email, password }  → { user, message }
 *   POST /auth/login            { email, password }        → { access_token, user }
 *                                 403 detail { code: "EMAIL_NOT_VERIFIED" } when unverified
 *   POST /auth/forgot-password  { email }                  → { message }   (always 200; never reveals if the email exists)
 *   POST /auth/reset-password   { token, password }        → { message }
 *   POST /auth/verify-email     { email, token }           → { access_token, user }   (token from the emailed link)
 *   POST /auth/resend-verification { email }               → { message, demoToken? }
 *
 * ── MOCK MODE ────────────────────────────────────────────────
 * With VITE_USE_MOCK_DATA=true, accounts are stored in this browser's
 * localStorage so every flow can be tested without a backend.
 * This is for frontend development ONLY — it is not secure and must
 * never be used with real passwords.
 */

const USERS_KEY = 'lumora:mock-users';
const RESET_KEY = 'lumora:mock-reset-tokens';
const USER_KEY = 'lumora:user';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function mockUsers() {
  const users = read(USERS_KEY, []);
  if (!users.some((u) => u.email === DEMO_ACCOUNT.email)) {
    users.push({ ...mockUser, email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password, verified: true });
    write(USERS_KEY, users);
  }
  return users;
}

const normalise = (email) => email.trim().toLowerCase();
// Never send the password back to the UI
const publicUser = ({ password: _password, ...user }) => user;

function startSession(user, remember = true) {
  const token = `mock-token-${user.id}`;
  tokenStorage.set(token, remember);
  (remember ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(publicUser(user)));
  return { access_token: token, user: publicUser(user) };
}

export const authService = {
  async register({ name, email, password }) {
    if (!USE_MOCK_DATA) return api.post('/auth/register', { name, email, password }, { skipAuth: true });

    const users = mockUsers();
    const key = normalise(email);
    if (users.some((u) => u.email === key)) {
      return mockReject('An account with this email already exists. Try signing in instead.', {
        status: 409,
        code: 'EMAIL_TAKEN',
      });
    }
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const user = {
      id: `student-${Date.now()}`,
      firstName,
      lastName: rest.join(' '),
      email: key,
      password,
      verified: false,
      onboardingComplete: false,
      profileCompletion: 10,
      targetRole: null,
      createdAt: new Date().toISOString(),
    };
    write(USERS_KEY, [...users, user]);
    return mockDelay({ user: publicUser(user), message: 'Account created. Please verify your email.' }, 900);
  },

  async login({ email, password, remember = true }) {
    if (!USE_MOCK_DATA) {
      const result = await api.post('/auth/login', { email, password }, { skipAuth: true });
      tokenStorage.set(result.access_token, remember);
      (remember ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(result.user));
      return result;
    }

    const user = mockUsers().find((u) => u.email === normalise(email));
    if (!user || user.password !== password) {
      return mockReject('Incorrect email or password.', { status: 401, code: 'INVALID_CREDENTIALS' }, 900);
    }
    if (!user.verified) {
      return mockReject('Please verify your email address before signing in.', {
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
      }, 900);
    }
    await mockDelay(null, 900);
    return startSession(user, remember);
  },

  async forgotPassword({ email }) {
    if (!USE_MOCK_DATA) return api.post('/auth/forgot-password', { email }, { skipAuth: true });

    // Mock: issue a reset token if the account exists, but respond the same either way.
    const key = normalise(email);
    let demoToken = null;
    if (mockUsers().some((u) => u.email === key)) {
      demoToken = Math.random().toString(36).slice(2, 10);
      write(RESET_KEY, { ...read(RESET_KEY, {}), [demoToken]: key });
    }
    return mockDelay(
      { message: 'If an account exists for this email, a reset link is on its way.', demoToken },
      900,
    );
  },

  async resetPassword({ token, password }) {
    if (!USE_MOCK_DATA) return api.post('/auth/reset-password', { token, password }, { skipAuth: true });

    const tokens = read(RESET_KEY, {});
    const email = tokens[token];
    if (!email) {
      return mockReject('This reset link is invalid or has expired. Please request a new one.', {
        status: 400,
        code: 'INVALID_TOKEN',
      });
    }
    write(USERS_KEY, mockUsers().map((u) => (u.email === email ? { ...u, password } : u)));
    delete tokens[token];
    write(RESET_KEY, tokens);
    return mockDelay({ message: 'Your password has been reset.' }, 900);
  },

  async verifyEmail({ email, token }) {
    if (!USE_MOCK_DATA) {
      const result = await api.post('/auth/verify-email', { email, token }, { skipAuth: true });
      tokenStorage.set(result.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      return result;
    }
    const key = normalise(email);
    const users = mockUsers().map((u) => (u.email === key ? { ...u, verified: true } : u));
    const user = users.find((u) => u.email === key);
    if (!user) return mockReject('We couldn’t find an account for this email.', { status: 404 });
    write(USERS_KEY, users);
    await mockDelay(null, 900);
    return startSession(user);
  },

  async resendVerification({ email }) {
    if (!USE_MOCK_DATA) return api.post('/auth/resend-verification', { email }, { skipAuth: true });
    return mockDelay({ message: `We sent a new verification link to ${email}.` }, 800);
  },

  /** Remove an unverified account so the student can sign up with a different email (mock only). */
  async discardUnverified({ email }) {
    if (USE_MOCK_DATA) {
      write(USERS_KEY, mockUsers().filter((u) => !(u.email === normalise(email) && !u.verified)));
    }
    return { ok: true };
  },

  /** Keep the mock account in sync when the profile changes. */
  syncMockUser(user) {
    if (!USE_MOCK_DATA || !user) return;
    write(USERS_KEY, mockUsers().map((u) => (u.email === user.email ? { ...u, ...user, password: u.password } : u)));
  },

  logout() {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  /** Restore the session on page load. */
  getStoredUser() {
    if (!tokenStorage.get()) return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
};
