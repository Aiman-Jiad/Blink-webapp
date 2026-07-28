import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Camera, Loader2, Check, Trash2, User as UserIcon, AtSign, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { AvatarCropper } from '@/components/shared/AvatarCropper';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { dataService } from '@/services/dataService';
import { cn } from '@/lib/utils';

const MAX_ABOUT = 200;

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'Keep it under 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and underscores only'),
  about: z.string().max(MAX_ABOUT, `Keep it under ${MAX_ABOUT} characters`).optional(),
});

type FormValues = z.infer<typeof schema>;

const ABOUT_PRESETS = [
  'Hey there! I am using Blink.',
  'Available',
  'Busy',
  'At work',
  'In a meeting',
  'Battery about to die',
];

type UsernameState = 'idle' | 'checking' | 'available' | 'taken';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(user?.photoURL ?? null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [usernameInput, setUsernameInput] = useState(user?.username ?? '');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      about: user?.about ?? '',
    },
  });

  const aboutValue = form.watch('about') ?? '';
  const usernameValue = form.watch('username') ?? '';

  // Debounced username availability check — only checks when username changed from current
  useEffect(() => {
    if (!usernameValue || usernameValue === user?.username) {
      setUsernameState('idle');
      return;
    }
    if (usernameValue.length < 3 || !/^[a-z0-9_]+$/.test(usernameValue)) {
      setUsernameState('idle');
      return;
    }
    setUsernameState('checking');
    const t = setTimeout(async () => {
      try {
        const users = await dataService.users.search(usernameValue);
        const exactMatch = users.find((u) => u.username === usernameValue && u.id !== user?.id);
        setUsernameState(exactMatch ? 'taken' : 'available');
      } catch {
        setUsernameState('idle');
      }
    }, 350);
    return () => clearTimeout(t);
  }, [usernameValue, user?.username, user?.id]);

  const openCropper = useCallback((file: File) => {
    setCropperFile(file);
    setCropperOpen(true);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    openCropper(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  }

  function handleCropSave(dataUrl: string) {
    setPhoto(dataUrl);
    setCropperOpen(false);
    setCropperFile(null);
  }

  function removePhoto() {
    setPhoto(null);
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
    if (usernameState === 'taken') {
      toast.error('That username is already taken');
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        ...user,
        name: values.name,
        username: values.username,
        about: values.about || 'Hey there! I am using Blink.',
        photoURL: photo,
      });
      updateUser(updated);
      toast.success('Profile updated');
      navigate('/profile');
    } catch (e) {
      toast.error('Could not update profile', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 glass-strong px-3 py-3.5 backdrop-blur lg:px-4 lg:py-4">
        <Button asChild size="icon" variant="ghost">
          <Link to="/profile" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="font-display text-lg font-bold">Edit profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-mobile-nav md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          {/* Photo */}
          <div className="mb-6 flex flex-col items-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="group relative"
              aria-label="Change profile photo"
            >
              <div className="h-28 w-28 overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                {photo ? (
                  <img src={photo} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-primary/15 font-display text-3xl font-bold text-primary">
                    {initials || '?'}
                  </div>
                )}
              </div>
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-7 w-7 text-white" />
              </span>
            </button>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Change photo
              </button>
              {photo && (
                <>
                  <span className="text-border" />
                  <button
                    onClick={removePhoto}
                    className="flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input
                          className="pl-8"
                          {...field}
                          onChange={(e) => {
                            const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                            field.onChange(cleaned);
                            setUsernameInput(cleaned);
                          }}
                        />
                        {/* Status indicator */}
                        {usernameState !== 'idle' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {usernameState === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {usernameState === 'available' && <Check className="h-4 w-4 text-emerald-500" />}
                            {usernameState === 'taken' && <span className="text-xs font-medium text-destructive">Taken</span>}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    {usernameState === 'available' && (
                      <p className="text-xs font-medium text-emerald-500">Username is available</p>
                    )}
                    {usernameState === 'taken' && (
                      <p className="text-xs font-medium text-destructive">This username is already taken</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* About / Bio */}
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} placeholder="Tell people about yourself" maxLength={MAX_ABOUT} />
                    </FormControl>
                    {/* Character counter */}
                    <div className="flex justify-end">
                      <span className={cn(
                        'text-xs tabular-nums',
                        aboutValue.length > MAX_ABOUT - 20 ? 'text-amber-500' : 'text-muted-foreground',
                      )}>
                        {aboutValue.length}/{MAX_ABOUT}
                      </span>
                    </div>
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {ABOUT_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => field.onChange(preset)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs transition-colors',
                            field.value === preset
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/profile">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving || usernameState === 'taken' || usernameState === 'checking'}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Check className="mr-1.5 h-4 w-4" /> Save changes</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>

      {/* Avatar cropper modal */}
      <AvatarCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageFile={cropperFile}
        onSave={handleCropSave}
      />
    </div>
  );
}
