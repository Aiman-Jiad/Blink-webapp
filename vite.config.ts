import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves the site at https://<user>.github.io/<repo>/
//
// We read the base path from the VITE_BASE_PATH env var (set by the CI
// workflow). This gives absolute paths like /Blink-webapp/ which are
// bullet-proof on GitHub Pages — no relative-path edge cases.
//
// For local dev / preview without the env var, we fall back to './' so
// the build works from any local path without configuration.
const base = process.env.VITE_BASE_PATH || './';

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          motion: ['framer-motion'],
          emoji: ['emoji-picker-react'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
