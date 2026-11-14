import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const singleFile = process.env.SINGLE_FILE === '1';

// Files in public/ that the installed app needs when there's no signal.
const PUBLIC_FILES = [
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon-32.png',
];

// Writes sw.js next to the build, listing every built file so the whole app
// is stored on the phone the first time it opens.
function serviceWorker(): Plugin {
  return {
    name: 'games-course-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      if (singleFile) return;
      const built = Object.keys(bundle).filter((file) => !file.endsWith('.map') && file !== 'index.html');
      const precache = ['./', ...PUBLIC_FILES, ...built].map((file) => (file === './' ? file : `./${file}`));
      const source = readFileSync(new URL('./pwa/sw.template.js', import.meta.url), 'utf8')
        .replace('__VERSION__', String(Date.now()))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// A relative base lets the build run from a GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  define: {
    'import.meta.env.VITE_SINGLE_FILE': JSON.stringify(singleFile ? '1' : ''),
  },
  // Fonts and sprites stay inside the build, so nothing loads from other sites.
  build: {
    assetsInlineLimit: 200_000,
    // The preview artifact is one file, so it can't load separate chunks.
    rollupOptions: { output: { inlineDynamicImports: singleFile } },
  },
});
