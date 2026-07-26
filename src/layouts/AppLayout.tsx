import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
