import { defineConfig } from 'vite';

export default defineConfig({
  // Use repository name as base for GitHub Pages, otherwise use './' for local dev
  base: process.env.GITHUB_ACTIONS ? '/kobayashi-maru/' : './',
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
