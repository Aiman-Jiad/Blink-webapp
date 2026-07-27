import { NavLink } from 'react-router-dom';
import { MessageSquare, Users, CircleDot, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';

const NAV = [
  { to: '/chats', icon: MessageSquare, label: 'Chats' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/status', icon: CircleDot, label: 'Status' },
  { to: '/calls', icon: Phone, label: 'Calls' },
];

export function MobileNav() {
  const chats = useChatStore((s) => s.chats);
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount.me ?? 0), 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border/60 bg-panel/95 backdrop-blur-lg md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all duration-200 active:scale-95',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative transition-transform duration-200" style={{ transform: isActive ? 'translateY(-1px) scale(1.08)' : 'none' }}>
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                {item.label === 'Chats' && totalUnread > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/30">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
