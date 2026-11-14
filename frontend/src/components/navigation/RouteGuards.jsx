import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Only signed-in students may enter. Others go to /login and come back afterwards. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Login / sign-up pages: signed-in students are sent to their app instead. */
export function GuestRoute() {
  const { isAuthenticated, user } = useAuth();
  // Decide once, when the guest area is entered. Without this, a successful
  // login would redirect instantly and skip the "signed in" success state.
  const [wasSignedInOnEntry] = useState(isAuthenticated);
  if (wasSignedInOnEntry) {
    return <Navigate to={user?.onboardingComplete ? '/app/dashboard' : '/onboarding'} replace />;
  }
  return <Outlet />;
}
