import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

// Load VITE_* vars from .env.local so the live end-to-end test can talk to
// Supabase. Nothing is written to the repo - the values are read at runtime.
const env = loadEnv('development', process.cwd(), 'VITE_');

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    env: {
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
  },
});
