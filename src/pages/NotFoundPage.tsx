import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size={48} showWordmark className="mb-8 justify-center" />
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary">
          <Compass className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-foreground">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">This page wandered off.</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Button asChild className="mt-6">
          <Link to="/chats">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to chats
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
