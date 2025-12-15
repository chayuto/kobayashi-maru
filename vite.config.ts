import { defineConfig } from 'vite';

export default defineConfig({
  // Use '/' for custom domain deployment, './' for local dev
  base: process.env.GITHUB_ACTIONS ? '/' : './',
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
});
