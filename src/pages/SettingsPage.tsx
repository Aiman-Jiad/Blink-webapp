import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Monitor, Bell, Shield, Palette, User, LogOut,
  ChevronRight, Volume2, Check, Eye, Trash2, Type, Download, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const [resetOpen, setResetOpen] = useState(false);
  const { canInstall, installed, promptInstall } = usePWAInstall();

  async function handleInstall() {
    const ok = await promptInstall();
    if (ok) toast.success('Blink installed');
  }

  async function handleLogout() {
    await authService.signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }

  const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 glass-strong px-4 py-3.5 shadow-soft lg:px-6 lg:py-4">
        <h1 className="font-display text-lg font-bold tracking-tight">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-mobile-nav md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl space-y-6"
        >
          {/* Appearance */}
          <Section icon={Palette} title="Appearance" description="Customize how Blink looks.">
            <div className="px-4 py-3">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Sun className="h-4 w-4 text-muted-foreground" /> Theme
              </p>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.mode}
                    onClick={() => settings.setTheme(t.mode)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                      settings.theme === t.mode
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40',
                    )}
                  >
                    <t.icon className={cn('h-5 w-5', settings.theme === t.mode ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <SettingRow
              icon={Type}
              label="Font size"
              description="Adjust text size for readability"
            >
              <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => settings.set('fontSize', size)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                      settings.fontSize === size ? 'bg-panel text-foreground shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </SettingRow>
            <Separator />
            <SettingRow
              icon={Eye}
              label="High contrast"
              description="Increase contrast for better visibility"
            >
              <Switch checked={settings.highContrast} onCheckedChange={(v) => settings.set('highContrast', v)} />
            </SettingRow>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Notifications" description="Manage how you're notified.">
            <SettingRow icon={Bell} label="Push notifications" description="Get notified of new messages">
              <Switch checked={settings.notifications} onCheckedChange={(v) => settings.set('notifications', v)} />
            </SettingRow>
            <Separator />
            <SettingRow icon={Volume2} label="Sound" description="Play a sound for new messages">
              <Switch checked={settings.sound} onCheckedChange={(v) => settings.set('sound', v)} />
            </SettingRow>
          </Section>

          {/* Privacy */}
          <Section icon={Shield} title="Privacy" description="Control your privacy and security.">
            <SettingRow icon={Check} label="Read receipts" description="Send read receipts to others">
              <Switch checked={settings.readReceipts} onCheckedChange={(v) => settings.set('readReceipts', v)} />
            </SettingRow>
            <Separator />
            <SettingRow icon={Eye} label="Last seen" description="Show when you were last active">
              <Switch checked defaultChecked />
            </SettingRow>
            <Separator />
            <SettingRow icon={Shield} label="Blocked contacts" description="Manage blocked users">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </SettingRow>
          </Section>

          {/* Chat */}
          <Section icon={User} title="Chats" description="Customize your chat experience.">
            <SettingRow icon={Check} label="Enter to send" description="Press Enter to send a message">
              <Switch checked={settings.enterToSend} onCheckedChange={(v) => settings.set('enterToSend', v)} />
            </SettingRow>
            <Separator />
            <SettingRow icon={Check} label="Media auto-download" description="Automatically download photos and videos">
              <Switch checked={settings.mediaAutoDownload} onCheckedChange={(v) => settings.set('mediaAutoDownload', v)} />
            </SettingRow>
          </Section>

          {/* App — PWA install */}
          <Section icon={Download} title="App" description="Install Blink as an app on your device.">
            {installed ? (
              <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Blink is installed and can run offline.
              </div>
            ) : canInstall ? (
              <button
                onClick={handleInstall}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Download className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Install app</p>
                  <p className="text-sm text-muted-foreground">Add Blink to your home screen for offline access</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                Use your browser's “Install app” or “Add to Home Screen” option to install Blink.
              </div>
            )}
          </Section>

          {/* Account */}
          <Section icon={User} title="Account" description="Manage your account.">
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <Separator />
            <button
              onClick={() => { authService.sendEmailVerification(); toast.success('Verification email sent'); }}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">Email verification</p>
                <p className="text-sm text-muted-foreground">Send a verification link</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <Separator />
            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogTrigger asChild>
                <button className="flex w-full items-center gap-3 p-4 text-left text-destructive transition-colors hover:bg-destructive/5">
                  <Trash2 className="h-5 w-5" />
                  <span className="font-medium">Reset settings to default</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will restore all settings to their default values. Your chats and account are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { settings.reset(); toast.success('Settings reset'); }}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="card-soft flex w-full items-center gap-3 p-4 text-destructive transition-colors hover:bg-destructive/5"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign out</span>
          </button>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Blink v1.0.0 · Made with care
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon, title, description, children,
}: {
  icon: typeof Sun;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      </div>
      <div className="card-soft overflow-hidden">{children}</div>
      <p className="mt-1.5 px-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SettingRow({
  icon: Icon, label, description, children,
}: {
  icon: typeof Sun;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
