import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Edit, Mail, AtSign, Info, Shield, LogOut, ChevronRight, QrCode, Share2,
  Camera, Eye, Clock, Circle, CheckCheck, Lock, KeyRound, Trash2, Star, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { QRDialog } from '@/components/shared/QRDialog';
import { PrivacyControl } from '@/components/shared/PrivacyControl';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { shareProfile, copyProfileLink } from '@/utils/share';
import { formatRelativeTime } from '@/utils';
import type { PrivacyScope, UserProfile } from '@/types';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const navigate = useNavigate();
  const [qrOpen, setQrOpen] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }, [navigate]);

  const updatePrivacy = useCallback(async (field: keyof UserProfile, value: PrivacyScope) => {
    if (!user) return;
    setSavingPrivacy(true);
    try {
      const updated = { ...user, [field]: value };
      await authService.updateProfile(updated);
      updateUser({ [field]: value });
      toast.success('Privacy setting updated');
    } catch (e) {
      toast.error('Could not update privacy setting');
    } finally {
      setSavingPrivacy(false);
    }
  }, [user, updateUser]);

  async function handleShare() {
    if (!user) return;
    const shared = await shareProfile(user);
    if (!shared) {
      const copied = await copyProfileLink(user);
      if (copied) toast.success('Profile link copied to clipboard');
      else toast.error('Could not share profile');
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-3">
          <div className="h-28 w-28 animate-pulse rounded-full bg-muted mx-auto" />
          <div className="h-5 w-32 animate-pulse rounded bg-muted mx-auto" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted mx-auto" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/40 glass-strong px-4 py-3.5 shadow-soft lg:px-6 lg:py-4">
        <h1 className="font-display text-lg font-bold tracking-tight">Profile</h1>
        <Button asChild size="sm" variant="ghost">
          <Link to="/profile/edit"><Edit className="mr-1.5 h-4 w-4" /> Edit</Link>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto pb-mobile-nav md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl"
        >
          {/* ============ Profile Header ============ */}
          <div className="relative overflow-hidden px-4 pt-5 lg:px-0">
            {/* Gradient backdrop */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <div className="relative card-soft overflow-hidden">
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                {/* Avatar */}
                <Link to="/profile/edit" className="group relative" aria-label="Edit profile photo">
                  <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-primary/20 ring-offset-2 ring-offset-background">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-primary/15 font-display text-3xl font-bold text-primary">
                        {initials || '?'}
                      </div>
                    )}
                  </div>
                  {/* Camera badge */}
                  <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background transition-transform group-hover:scale-110">
                    <Camera className="h-4 w-4" />
                  </span>
                  {/* Online indicator */}
                  {user.online && (
                    <span className="online-pulse absolute -right-0.5 top-1 h-5 w-5 rounded-full border-2 border-background bg-emerald-500" />
                  )}
                </Link>

                {/* Name + username */}
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight">{user.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">@{user.username}</p>
                </div>

                {/* About */}
                <p className="max-w-sm text-sm text-muted-foreground">{user.about}</p>

                {/* Status */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Circle className={user.online ? 'h-2 w-2 fill-emerald-500 text-emerald-500' : 'h-2 w-2 fill-slate-400 text-slate-400'} />
                  <span>{user.online ? 'online now' : `last seen ${formatRelativeTime(user.lastSeen)}`}</span>
                </div>

                {/* Action buttons */}
                <div className="flex w-full gap-2 pt-1">
                  <Button onClick={handleShare} variant="outline" className="flex-1" size="sm">
                    <Share2 className="mr-1.5 h-4 w-4" /> Share
                  </Button>
                  <Button onClick={() => setQrOpen(true)} variant="outline" className="flex-1" size="sm">
                    <QrCode className="mr-1.5 h-4 w-4" /> QR Code
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ============ Personal Information ============ */}
          <div className="space-y-3 px-4 pt-5 lg:px-0">
            <SectionTitle>Personal Information</SectionTitle>
            <div className="card-soft divide-y divide-border/60">
              <InfoRow icon={Edit} label="Name" value={user.name} />
              <Separator />
              <InfoRow icon={AtSign} label="Username" value={`@${user.username}`} />
              <Separator />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <Separator />
              <InfoRow icon={Info} label="About" value={user.about} />
            </div>
          </div>

          {/* ============ Privacy ============ */}
          <div className="space-y-3 px-4 pt-5 lg:px-0">
            <SectionTitle>Privacy</SectionTitle>
            <div className="card-soft divide-y divide-border/60">
              <PrivacyControl
                icon={Camera}
                label="Profile Photo"
                description="Who can see your profile picture"
                value={user.photoVisibility}
                onChange={(v) => updatePrivacy('photoVisibility', v)}
              />
              <Separator />
              <PrivacyControl
                icon={Info}
                label="About"
                description="Who can see your bio / about"
                value={user.aboutVisibility}
                onChange={(v) => updatePrivacy('aboutVisibility', v)}
              />
              <Separator />
              <PrivacyControl
                icon={Clock}
                label="Last Seen"
                description="Who can see when you were last active"
                value={user.lastSeenVisibility}
                onChange={(v) => updatePrivacy('lastSeenVisibility', v)}
              />
              <Separator />
              <PrivacyControl
                icon={Circle}
                label="Online Status"
                description="Who can see your online presence"
                value={user.onlineStatusVisibility}
                onChange={(v) => updatePrivacy('onlineStatusVisibility', v)}
              />
              <Separator />
              <PrivacyControl
                icon={CheckCheck}
                label="Read Receipts"
                description="Who can see your read receipts"
                value={user.readReceiptsVisibility}
                onChange={(v) => updatePrivacy('readReceiptsVisibility', v)}
              />
            </div>
            {savingPrivacy && (
              <p className="text-center text-xs text-muted-foreground">Saving…</p>
            )}
          </div>

          {/* ============ Account ============ */}
          <div className="space-y-3 px-4 pt-5 lg:px-0">
            <SectionTitle>Account</SectionTitle>
            <div className="card-soft divide-y divide-border/60">
              <LinkRow icon={KeyRound} label="Change Password" to="/settings" />
              <Separator />
              <LinkRow icon={Lock} label="Security" to="/settings" />
              <Separator />
              <LinkRow icon={Bell} label="Notifications" to="/settings" />
              <Separator />
              <LinkRow icon={Star} label="Starred Messages" to="/chats" />
            </div>

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

            <p className="pt-1 pb-2 text-center text-xs text-muted-foreground">
              Blink v1.0.0
            </p>
          </div>
        </motion.div>
      </div>

      <QRDialog open={qrOpen} onOpenChange={setQrOpen} user={user} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

function LinkRow({ icon: Icon, label, to }: { icon: typeof Bell; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}
