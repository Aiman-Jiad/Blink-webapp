import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await authService.sendPasswordReset(values.email);
      setSent(true);
      toast.success('Reset link sent', { description: `Check ${values.email}` });
    } catch (e) {
      toast.error('Could not send reset link', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We've sent a password reset link to{' '}
          <span className="font-medium text-foreground">{form.getValues('email')}</span>.
          Follow the link to reset your password.
        </p>
        <div className="mt-6 space-y-2.5">
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to sign in
            </Link>
          </Button>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Didn't receive it? Try again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>

      <div className="mb-8">
        <div className="mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Forgot password?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          No worries — enter your email and we'll send you a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-10" placeholder="you@example.com" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send reset link
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
