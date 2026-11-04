import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base lets the build run from a GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Fonts and sprites stay inside the build, so nothing loads from other sites.
  build: {
    assetsInlineLimit: 200_000,
    // The preview artifact is one file, so it can't load separate chunks.
    rollupOptions: { output: { inlineDynamicImports: process.env.SINGLE_FILE === '1' } },
  },
});
