import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

/**
 * Holds the signed-in student for the whole app.
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    return result;
  }, []);

  const verifyEmail = useCallback(async (email, token) => {
    const result = await authService.verifyEmail({ email, token });
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  /** Merge changes into the current user (profile edits, onboarding progress). */
  const updateUser = useCallback((changes) => {
    setUser((current) => {
      const next = { ...current, ...changes };
      const storage = localStorage.getItem('lumora:user') ? localStorage : sessionStorage;
      storage.setItem('lumora:user', JSON.stringify(next));
      authService.syncMockUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout, verifyEmail, updateUser }),
    [user, login, logout, verifyEmail, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
