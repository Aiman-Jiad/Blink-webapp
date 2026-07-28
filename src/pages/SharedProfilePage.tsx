import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, UserPlus, Loader2, AlertCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { dataService } from '@/services/dataService';
import { useChatStore } from '@/store/chatStore';
import { copyProfileLink } from '@/utils/share';
import type { UserProfile } from '@/types';

export default function SharedProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const chats = useChatStore((s) => s.chats);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    dataService.users
      .search(username)
      .then((users) => {
        const match = users.find((u) => u.username === username);
        setProfile(match ?? null);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  function handleStartChat() {
    if (!profile) return;
    const existing = chats.find((c) => c.type === 'direct' && c.participantIds.includes(profile.id));
    if (existing) {
      navigate(`/chats/${existing.id}`);
    } else {
      navigate('/chats');
      toast.info('Open a chat from the new chat button to start messaging');
    }
  }

  async function handleShare() {
    if (!profile) return;
    const ok = await copyProfileLink(profile);
    if (ok) toast.success('Profile link copied');
    else toast.error('Could not copy link');
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-border/60 glass-strong px-3 py-3.5">
          <Button asChild size="icon" variant="ghost">
            <Link to="/chats" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-display text-lg font-bold">Profile</h1>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-border/60 glass-strong px-3 py-3.5">
          <Button asChild size="icon" variant="ghost">
            <Link to="/chats" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-display text-lg font-bold">Profile</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">Profile not found</p>
            <p className="text-sm text-muted-foreground">The user @{username} doesn't exist or is not available.</p>
          </div>
          <Button asChild variant="outline"><Link to="/chats">Back to chats</Link></Button>
        </div>
      </div>
    );
  }

  const initials = profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 glass-strong px-3 py-3.5 lg:px-4">
        <Button asChild size="icon" variant="ghost">
          <Link to="/chats" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="font-display text-lg font-bold">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-mobile-nav md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-lg"
        >
          <div className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <div className="relative card-soft overflow-hidden">
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-primary/20 ring-offset-2 ring-offset-background">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-primary/15 font-display text-3xl font-bold text-primary">
                      {initials || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight">{profile.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
                </div>
                {profile.about && (
                  <p className="max-w-sm text-sm text-muted-foreground">{profile.about}</p>
                )}
                <div className="flex w-full gap-2 pt-1">
                  <Button onClick={handleStartChat} className="flex-1" size="sm">
                    <MessageSquare className="mr-1.5 h-4 w-4" /> Message
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="flex-1" size="sm">
                    <Share2 className="mr-1.5 h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
