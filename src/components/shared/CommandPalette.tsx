import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MessageSquare, Users, CircleDot, Phone, Settings, User,
  Moon, Sun, Monitor, LogOut, CornerDownLeft,
} from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Search;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const navigate = useNavigate();

  const items: CommandItem[] = [
    { id: 'nav-chats', label: 'Go to Chats', icon: MessageSquare, shortcut: 'g c', group: 'Navigation', action: () => navigate('/chats') },
    { id: 'nav-groups', label: 'Go to Groups', icon: Users, group: 'Navigation', action: () => navigate('/groups') },
    { id: 'nav-status', label: 'Go to Status', icon: CircleDot, shortcut: 'g s', group: 'Navigation', action: () => navigate('/status') },
    { id: 'nav-calls', label: 'Go to Calls', icon: Phone, group: 'Navigation', action: () => navigate('/calls') },
    { id: 'nav-profile', label: 'Go to Profile', icon: User, shortcut: 'g p', group: 'Navigation', action: () => navigate('/profile') },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, shortcut: 'g e', group: 'Navigation', action: () => navigate('/settings') },
    { id: 'theme-light', label: 'Switch to Light mode', icon: Sun, group: 'Theme', action: () => { setTheme('light'); toast.success('Light mode'); } },
    { id: 'theme-dark', label: 'Switch to Dark mode', icon: Moon, group: 'Theme', action: () => { setTheme('dark'); toast.success('Dark mode'); } },
    { id: 'theme-system', label: 'Use System theme', icon: Monitor, group: 'Theme', action: () => { setTheme('system'); toast.success('System theme'); } },
    { id: 'logout', label: 'Sign out', icon: LogOut, group: 'Account', action: async () => { await authService.signOut(); toast.success('Signed out'); navigate('/login'); } },
  ];

  function run(item: CommandItem) {
    item.action();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <CommandPrimitive className="rounded-xl">
            <div className="flex items-center gap-2 border-b border-border/60 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <CommandPrimitive.Input
                placeholder="Type a command or search…"
                className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">ESC</kbd>
            </div>
            <CommandPrimitive.List className="max-h-[360px] overflow-y-auto p-2">
              <CommandPrimitive.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </CommandPrimitive.Empty>
              {Array.from(new Set(items.map((i) => i.group))).map((group) => (
                <CommandPrimitive.Group key={group} heading={group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground">
                  {items.filter((i) => i.group === group).map((item) => (
                    <CommandPrimitive.Item
                      key={item.id}
                      onSelect={() => run(item)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-muted"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          {item.shortcut.split(' ').map((k, i) => (
                            <kbd key={i} className="rounded border border-border px-1 py-0.5 text-[10px]">{k}</kbd>
                          ))}
                        </span>
                      )}
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
