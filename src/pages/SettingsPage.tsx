import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Monitor, Bell, Shield, Palette, User, LogOut,
  ChevronRight, Volume2, Check, Eye, Trash2, Type, Download, CheckCircle2,
  QrCode, Pencil, Lock, Database, HelpCircle, Info, Code2, KeyRound,
  MessageSquare, Smartphone, Fingerprint, ChevronDown,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const [resetOpen, setResetOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { canInstall, installed, promptInstall } = usePWAInstall();

  const handleInstall = useCallback(async () => {
    const ok = await promptInstall();
    if (ok) toast.success('Blink installed');
  }, [promptInstall]);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }, [navigate]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 glass-strong px-4 py-3.5 shadow-soft lg:px-6 lg:py-4">
        <h1 className="font-display text-lg font-bold tracking-tight">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-mobile-nav md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl"
        >
          {/* Premium profile card */}
          <ProfileCard
            name={user?.name ?? 'Blink User'}
            username={user?.username ?? 'blinkuser'}
            about={user?.about ?? 'Hey there! I am using Blink.'}
            photoURL={user?.photoURL ?? null}
            online={user?.online ?? false}
            onEdit={() => navigate('/profile/edit')}
            onQR={() => setQrOpen(true)}
          />

          <div className="space-y-3 px-4 pt-5 lg:px-0">
            {/* Account */}
            <SettingsSection
              id="account"
              icon={User}
              title="Account"
              subtitle="Manage your identity and account details"
              expanded={expandedSection === 'account'}
              onToggle={() => toggleSection('account')}
            >
              <div className="px-4 py-3.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-0.5 font-medium">{user?.email}</p>
              </div>
              <Separator />
              <button
                onClick={() => { authService.sendEmailVerification(); toast.success('Verification email sent'); }}
                className="setting-row ripple"
              >
                <SettingIcon icon={CheckCircle2} color="emerald" />
                <div className="flex-1">
                  <p className="font-medium">Email verification</p>
                  <p className="text-sm text-muted-foreground">Send a verification link</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('Two-factor authentication coming soon')}>
                <SettingIcon icon={KeyRound} color="blue" />
                <div className="flex-1">
                  <p className="font-medium">Two-step verification</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </SettingsSection>

            {/* Privacy */}
            <SettingsSection
              id="privacy"
              icon={Shield}
              title="Privacy"
              subtitle="Control who can see your information"
              expanded={expandedSection === 'privacy'}
              onToggle={() => toggleSection('privacy')}
            >
              <ToggleRow
                icon={Check}
                label="Read receipts"
                description="Send read receipts to others"
                checked={settings.readReceipts}
                onChange={(v) => settings.set('readReceipts', v)}
              />
              <Separator />
              <ToggleRow
                icon={Eye}
                label="Last seen"
                description="Show when you were last active"
                checked={true}
                onChange={() => toast.info('Last seen visibility is always on in this build')}
              />
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('No blocked contacts')}>
                <SettingIcon icon={Lock} color="amber" />
                <div className="flex-1">
                  <p className="font-medium">Blocked contacts</p>
                  <p className="text-sm text-muted-foreground">Manage blocked users</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </SettingsSection>

            {/* Chats */}
            <SettingsSection
              id="chats"
              icon={MessageSquare}
              title="Chats"
              subtitle="Customize your chat experience"
              expanded={expandedSection === 'chats'}
              onToggle={() => toggleSection('chats')}
            >
              <ToggleRow
                icon={Check}
                label="Enter to send"
                description="Press Enter to send a message"
                checked={settings.enterToSend}
                onChange={(v) => settings.set('enterToSend', v)}
              />
              <Separator />
              <ToggleRow
                icon={Download}
                label="Media auto-download"
                description="Automatically download photos and videos"
                checked={settings.mediaAutoDownload}
                onChange={(v) => settings.set('mediaAutoDownload', v)}
              />
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection
              id="notifications"
              icon={Bell}
              title="Notifications"
              subtitle="Manage how you're notified"
              expanded={expandedSection === 'notifications'}
              onToggle={() => toggleSection('notifications')}
            >
              <ToggleRow
                icon={Bell}
                label="Push notifications"
                description="Get notified of new messages"
                checked={settings.notifications}
                onChange={(v) => settings.set('notifications', v)}
              />
              <Separator />
              <ToggleRow
                icon={Volume2}
                label="Sound"
                description="Play a sound for new messages"
                checked={settings.sound}
                onChange={(v) => settings.set('sound', v)}
              />
            </SettingsSection>

            {/* Storage */}
            <SettingsSection
              id="storage"
              icon={Database}
              title="Storage"
              subtitle="Manage data and storage usage"
              expanded={expandedSection === 'storage'}
              onToggle={() => toggleSection('storage')}
            >
              <div className="px-4 py-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Storage usage</p>
                  <p className="text-sm text-muted-foreground">12.4 MB</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: '18%' }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">Photos · Videos · Documents · Voice notes</p>
              </div>
              <Separator />
              <button className="setting-row ripple text-destructive" onClick={() => toast.info('Clearing chats…')}>
                <SettingIcon icon={Trash2} color="red" />
                <div className="flex-1">
                  <p className="font-medium">Clear chat history</p>
                  <p className="text-sm text-muted-foreground">Remove all messages from all chats</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </SettingsSection>

            {/* Appearance */}
            <SettingsSection
              id="appearance"
              icon={Palette}
              title="Appearance"
              subtitle="Customize how Blink looks"
              expanded={expandedSection === 'appearance'}
              onToggle={() => toggleSection('appearance')}
            >
              <div className="px-4 py-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Sun className="h-4 w-4 text-muted-foreground" /> Theme
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {themes.map((t) => (
                    <button
                      key={t.mode}
                      onClick={() => settings.setTheme(t.mode)}
                      className={cn(
                        'flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all duration-200 active:scale-95',
                        settings.theme === t.mode
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-border hover:border-muted-foreground/40',
                      )}
                    >
                      <t.icon className={cn('h-5 w-5 transition-colors', settings.theme === t.mode ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <ToggleRow
                icon={Eye}
                label="High contrast"
                description="Increase contrast for better visibility"
                checked={settings.highContrast}
                onChange={(v) => settings.set('highContrast', v)}
              />
              <Separator />
              <div className="px-4 py-3.5">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Type className="h-4 w-4 text-muted-foreground" /> Font size
                </p>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => settings.set('fontSize', size)}
                      className={cn(
                        'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all duration-200',
                        settings.fontSize === size ? 'bg-panel text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </SettingsSection>

            {/* Security */}
            <SettingsSection
              id="security"
              icon={Fingerprint}
              title="Security"
              subtitle="Protect your account and messages"
              expanded={expandedSection === 'security'}
              onToggle={() => toggleSection('security')}
            >
              <ToggleRow
                icon={Fingerprint}
                label="Biometric lock"
                description="Use fingerprint or face unlock"
                checked={false}
                onChange={() => toast.info('Biometric lock requires device support')}
              />
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('Change password screen coming soon')}>
                <SettingIcon icon={KeyRound} color="blue" />
                <div className="flex-1">
                  <p className="font-medium">Change password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('Security notifications enabled')}>
                <SettingIcon icon={Bell} color="emerald" />
                <div className="flex-1">
                  <p className="font-medium">Security alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified of suspicious activity</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </SettingsSection>

            {/* Help */}
            <SettingsSection
              id="help"
              icon={HelpCircle}
              title="Help"
              subtitle="Get support and learn how to use Blink"
              expanded={expandedSection === 'help'}
              onToggle={() => toggleSection('help')}
            >
              <button className="setting-row ripple" onClick={() => toast.info('FAQ coming soon')}>
                <SettingIcon icon={HelpCircle} color="blue" />
                <div className="flex-1">
                  <p className="font-medium">FAQ</p>
                  <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('Contact support at support@blink.app')}>
                <SettingIcon icon={MessageSquare} color="emerald" />
                <div className="flex-1">
                  <p className="font-medium">Contact us</p>
                  <p className="text-sm text-muted-foreground">Reach out to our support team</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </SettingsSection>

            {/* About Blink */}
            <SettingsSection
              id="about"
              icon={Info}
              title="About Blink"
              subtitle="Version info and legal"
              expanded={expandedSection === 'about'}
              onToggle={() => toggleSection('about')}
            >
              <div className="px-4 py-3.5">
                <p className="font-medium">Blink</p>
                <p className="text-sm text-muted-foreground">Version 1.0.0 · Made with care</p>
              </div>
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('Terms of Service')}>
                <SettingIcon icon={Info} color="blue" />
                <div className="flex-1">
                  <p className="font-medium">Terms of Service</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <Separator />
              <button className="setting-row ripple" onClick={() => toast.info('Privacy Policy')}>
                <SettingIcon icon={Shield} color="emerald" />
                <div className="flex-1">
                  <p className="font-medium">Privacy Policy</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </SettingsSection>

            {/* App / PWA Install */}
            <SettingsSection
              id="app"
              icon={Smartphone}
              title="App"
              subtitle="Install Blink on your device"
              expanded={expandedSection === 'app'}
              onToggle={() => toggleSection('app')}
            >
              {installed ? (
                <div className="flex items-center gap-3 p-4 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">Blink is installed and can run offline.</span>
                </div>
              ) : canInstall ? (
                <button onClick={handleInstall} className="setting-row ripple">
                  <SettingIcon icon={Download} color="blue" />
                  <div className="flex-1">
                    <p className="font-medium">Install app</p>
                    <p className="text-sm text-muted-foreground">Add to your home screen for offline access</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  Use your browser's "Install app" or "Add to Home Screen" option to install Blink.
                </div>
              )}
            </SettingsSection>

            {/* Developer Options */}
            <SettingsSection
              id="dev"
              icon={Code2}
              title="Developer Options"
              subtitle="Advanced settings for development"
              expanded={expandedSection === 'dev'}
              onToggle={() => toggleSection('dev')}
            >
              <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialogTrigger asChild>
                  <button className="setting-row ripple text-destructive">
                    <SettingIcon icon={Trash2} color="red" />
                    <div className="flex-1">
                      <p className="font-medium">Reset settings to default</p>
                      <p className="text-sm text-muted-foreground">Restore all preferences</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
            </SettingsSection>

            {/* Sign out */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="card-soft flex w-full items-center gap-3 p-4 text-destructive transition-colors hover:bg-destructive/5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-medium">Sign out</span>
            </motion.button>

            <p className="pt-3 pb-6 text-center text-xs text-muted-foreground">
              Blink v1.0.0 · Made with care
            </p>
          </div>
        </motion.div>
      </div>

      {/* QR Code dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Your QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pb-4">
            <div className="grid h-48 w-48 place-items-center rounded-2xl border-2 border-border bg-white p-3">
              <QRCodePlaceholder />
            </div>
            <div className="text-center">
              <p className="font-medium">{user?.name ?? 'Blink User'}</p>
              <p className="text-sm text-muted-foreground">@{user?.username ?? 'blinkuser'}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan this code with your camera to start a chat
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Profile card — premium hero at the top of settings
// ============================================================================
function ProfileCard({
  name, username, about, photoURL, online, onEdit, onQR,
}: {
  name: string;
  username: string;
  about: string;
  photoURL: string | null;
  online: boolean;
  onEdit: () => void;
  onQR: () => void;
}) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="relative overflow-hidden px-4 pt-5 lg:px-0">
      {/* Gradient backdrop */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="relative card-soft overflow-hidden"
      >
        <div className="flex items-center gap-4 p-5">
          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              {photoURL ? (
                <img src={photoURL} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-primary/15 font-display text-xl font-bold text-primary">
                  {initials || '?'}
                </div>
              )}
            </div>
            {online && (
              <span className="online-pulse absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
            )}
          </div>

          {/* Name + about */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold tracking-tight">{name}</h2>
            <p className="truncate text-sm text-muted-foreground">@{username}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{about}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex border-t border-border/40">
          <button
            onClick={onEdit}
            className="ripple flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <Pencil className="h-4 w-4" /> Edit profile
          </button>
          <div className="w-px bg-border/40" />
          <button
            onClick={onQR}
            className="ripple flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <QrCode className="h-4 w-4" /> QR code
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Collapsible settings section with animated expand
// ============================================================================
function SettingsSection({
  id, icon: Icon, title, subtitle, expanded, onToggle, children,
}: {
  id: string;
  icon: typeof Sun;
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="card-soft ripple flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/30"
        aria-expanded={expanded}
        aria-controls={`section-${id}`}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`section-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="card-soft mt-1.5 overflow-hidden">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Setting row with icon
// ============================================================================
function SettingIcon({ icon: Icon, color }: { icon: typeof Sun; color: 'blue' | 'emerald' | 'amber' | 'red' }) {
  const colorMap = {
    blue: 'bg-blue-500/15 text-blue-500',
    emerald: 'bg-emerald-500/15 text-emerald-500',
    amber: 'bg-amber-500/15 text-amber-500',
    red: 'bg-red-500/15 text-red-500',
  };
  return (
    <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', colorMap[color])}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

// ============================================================================
// Toggle row (icon + label + switch)
// ============================================================================
function ToggleRow({
  icon: Icon, label, description, checked, onChange,
}: {
  icon: typeof Sun;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ============================================================================
// Decorative QR code placeholder (CSS grid pattern)
// ============================================================================
function QRCodePlaceholder() {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const row = Math.floor(i / 21);
    const col = i % 21;
    const isCorner = (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7);
    const cornerOn = isCorner && (
      (row === 0 || row === 6 || col === 0 || col === 6) ||
      (row >= 2 && row <= 4 && col >= 2 && col <= 4)
    );
    const dataOn = !isCorner && ((row * 3 + col * 7 + row * col) % 3 === 0);
    return cornerOn || dataOn;
  });
  return (
    <div
      className="grid h-full w-full"
      style={{ gridTemplateColumns: 'repeat(21, 1fr)', gridTemplateRows: 'repeat(21, 1fr)' }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? 'bg-black' : 'bg-transparent'} />
      ))}
    </div>
  );
}
