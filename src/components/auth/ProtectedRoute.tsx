import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader } from '@/components/shared/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, hydrated } = useAuthStore();
  const location = useLocation();

  if (loading && !hydrated) {
    return <Loader fullscreen label="Loading Blink…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: ProtectedRouteProps) {
  const { user, loading, hydrated } = useAuthStore();

  if (loading && !hydrated) {
    return <Loader fullscreen label="Loading Blink…" />;
  }

  if (user) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
}
