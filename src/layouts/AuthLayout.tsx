import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import { ShieldCheck, Zap, Globe2 } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'Lightning fast', desc: 'Real-time messages delivered in milliseconds.' },
  { icon: ShieldCheck, title: 'Private by design', desc: 'Your conversations stay yours. End-to-end ready.' },
  { icon: Globe2, title: 'Everywhere you are', desc: 'Desktop, tablet, mobile — perfectly in sync.' },
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left — branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 p-12 lg:flex">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px, 60px 60px',
        }} />
        <div className="relative">
          <Logo size={44} showWordmark className="[&_*]:text-white" />
        </div>

        <div className="relative space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white">
              Connect instantly.
              <br />
              Conversation, perfected.
            </h1>
            <p className="mt-4 text-lg text-emerald-50/90">
              Blink is a premium messenger built for people who care about how their conversations feel.
            </p>
          </motion.div>

          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                className="flex items-start gap-4"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-emerald-50/80">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-emerald-50/70">
          © {new Date().getFullYear()} Blink. Crafted with care.
        </p>
      </div>

      {/* Right — auth form */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Logo size={40} showWordmark />
        </div>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
