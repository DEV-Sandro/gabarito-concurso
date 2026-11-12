import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_ARTIFACT ? './' : '/',
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'] },
});
