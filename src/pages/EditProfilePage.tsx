import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Camera, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and underscores only'),
  about: z.string().max(200, 'Keep it under 200 characters').optional(),
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

export default function EditProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(user?.photoURL ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      about: user?.about ?? '',
    },
  });

  function handlePhoto(file: File) {
    const url = URL.createObjectURL(file);
    setPhoto(url);
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
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

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 bg-panel/80 px-3 py-3 backdrop-blur lg:px-4">
        <Button asChild size="icon" variant="ghost">
          <Link to="/profile" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="font-display text-lg font-bold">Edit profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
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
              <UserAvatar name={user.name} src={photo} size="2xl" />
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-7 w-7 text-white" />
              </span>
            </button>
            <p className="mt-2 text-xs text-muted-foreground">Click to change photo</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} placeholder="Tell people about yourself" />
                    </FormControl>
                    <div className="flex flex-wrap gap-1.5 pt-1">
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

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/profile">Cancel</Link>
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
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
    </div>
  );
}
