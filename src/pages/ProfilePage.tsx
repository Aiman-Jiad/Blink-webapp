import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Mail, AtSign, Phone, Info, Bell, Shield, Palette, LogOut, ChevronRight } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/utils';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  async function handleLogout() {
    await authService.signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/60 bg-panel/80 px-4 py-3 backdrop-blur">
        <h1 className="font-display text-lg font-bold">Profile</h1>
        <Button asChild size="sm" variant="ghost">
          <Link to="/profile/edit"><Edit className="mr-1.5 h-4 w-4" /> Edit</Link>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-mobile-nav md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl space-y-4"
        >
          {/* Profile card */}
          <div className="card-soft flex flex-col items-center p-6 text-center">
            <UserAvatar name={user.name} src={user.photoURL} size="2xl" status={user.status} showStatus />
            <h2 className="mt-4 font-display text-2xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">
              {user.online ? 'online now' : `last seen ${formatRelativeTime(user.lastSeen)}`}
            </p>
            <Button asChild className="mt-4" variant="outline" size="sm">
              <Link to="/profile/edit"><Edit className="mr-1.5 h-4 w-4" /> Edit profile</Link>
            </Button>
          </div>

          {/* Info rows */}
          <div className="card-soft divide-y divide-border/60">
            <InfoRow icon={AtSign} label="Username" value={`@${user.username}`} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            {user.phone && <InfoRow icon={Phone} label="Phone" value={user.phone} />}
            <InfoRow icon={Info} label="About" value={user.about} />
          </div>

          {/* Quick links */}
          <div className="card-soft divide-y divide-border/60">
            <LinkRow icon={Bell} label="Notifications" to="/settings" />
            <LinkRow icon={Shield} label="Privacy" to="/settings" />
            <LinkRow icon={Palette} label="Appearance" to="/settings" />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="card-soft flex w-full items-center gap-3 p-4 text-destructive transition-colors hover:bg-destructive/5"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </motion.div>
      </div>
    </div>
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
