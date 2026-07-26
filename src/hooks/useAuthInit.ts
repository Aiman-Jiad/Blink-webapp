import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

/**
 * Subscribes to auth state changes and hydrates the auth store.
 * Should be mounted once near the root of the app.
 */
export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);
    const unsub = authService.onAuthChange((user) => {
      setUser(user);
    });
    return unsub;
  }, [setUser, setLoading]);
}
