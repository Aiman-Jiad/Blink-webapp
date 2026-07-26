import { NavLink } from 'react-router-dom';
import { MessageSquare, Users, CircleDot, Phone, Settings, UserCircle } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/chats', icon: MessageSquare, label: 'Chats', key: 'chats' },
  { to: '/groups', icon: Users, label: 'Groups', key: 'groups' },
  { to: '/status', icon: CircleDot, label: 'Status', key: 'status' },
  { to: '/calls', icon: Phone, label: 'Calls', key: 'calls' },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const chats = useChatStore((s) => s.chats);
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount.me ?? 0), 0);

  return (
    <aside className="hidden w-20 flex-col items-center justify-between border-r border-border/60 bg-panel py-5 md:flex lg:w-24">
      <div className="flex w-full flex-col items-center gap-1">
        <div className="mb-5">
          <Logo size={40} />
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-colors lg:w-20',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  {item.key === 'chats' && totalUnread > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-colors lg:w-20',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Settings className="h-5 w-5" strokeWidth={2} />
          <span>Settings</span>
        </NavLink>

        <NavLink to="/profile" className="transition-transform hover:scale-105">
          <UserAvatar
            name={user?.name ?? 'You'}
            src={user?.photoURL}
            size="md"
            status={user?.status}
            showStatus
          />
        </NavLink>
      </div>
    </aside>
  );
}
