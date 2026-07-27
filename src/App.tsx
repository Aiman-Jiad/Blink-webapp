import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuthInit } from '@/hooks/useAuthInit';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { Loader } from '@/components/shared/Loader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { CallOverlay } from '@/components/calls/CallOverlay';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ChatsPage = lazy(() => import('@/pages/ChatsPage'));
const ChatViewPage = lazy(() => import('@/pages/ChatViewPage'));
const GroupsPage = lazy(() => import('@/pages/GroupsPage'));
const StatusPage = lazy(() => import('@/pages/StatusPage'));
const CallsPage = lazy(() => import('@/pages/CallsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageFallback() {
  return <Loader fullscreen label="Loading…" />;
}

function AppRoutes() {
  useKeyboardShortcuts();
  const { pathname } = useLocation();

  // Scroll to top on route change (for non-chat pages)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public auth routes */}
        <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/chats" element={<ChatsPage />}>
            <Route path=":chatId" element={
              <ErrorBoundary>
                <ChatViewPage />
              </ErrorBoundary>
            } />
          </Route>
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/chats" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global overlays */}
      <CommandPalette />
      <GlobalSearch />
      <CallOverlay />
    </ErrorBoundary>
  );
}

export default function App() {
  useAuthInit();
  useTheme();

  return (
    <HashRouter>
      <Suspense fallback={<PageFallback />}>
        <AppRoutes />
      </Suspense>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: 'font-sans' }}
      />
    </HashRouter>
  );
}
