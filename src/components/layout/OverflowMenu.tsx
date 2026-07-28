import { useNavigate } from 'react-router-dom';
import {
  MoreVertical, User, Settings, Search, Star, Pin, Archive, Palette,
  Info, LogOut, Moon, Sun, Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';
import type { ThemeMode } from '@/types';

export function OverflowMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  function go(path: string) {
    navigate(path);
  }

  async function handleLogout() {
    await authService.signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }

  function setTheme(mode: ThemeMode) {
    settings.setTheme(mode);
    toast.success(`${mode[0].toUpperCase() + mode.slice(1)} mode`);
  }

  const themeIcon = settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 transition-all"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-xl border-border/60 p-1.5 shadow-xl"
      >
        {/* Profile header */}
        <DropdownMenuLabel className="px-2 py-2 font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{user?.name ?? 'Blink User'}</span>
            <span className="text-xs text-muted-foreground">@{user?.username ?? 'blinkuser'}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Primary actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => go('/profile')}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Search</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => go('/settings')}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Chat views */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => { toast.info('Showing starred messages'); }}
          >
            <Star className="h-4 w-4 text-muted-foreground" />
            <span>Starred Messages</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => { toast.info('Showing pinned messages'); }}
          >
            <Pin className="h-4 w-4 text-muted-foreground" />
            <span>Pinned Messages</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => { toast.info('Showing archived chats'); }}
          >
            <Archive className="h-4 w-4 text-muted-foreground" />
            <span>Archived Chats</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Appearance — quick theme toggle */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          >
            <ThemeIcon className="h-4 w-4 text-muted-foreground" />
            <span>{settings.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => go('/settings')}
          >
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span>Appearance</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* About + Logout */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent"
            onClick={() => { toast.info('Blink v1.0.0 — Made with care'); }}
          >
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>About Blink</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-destructive outline-none transition-colors focus:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
