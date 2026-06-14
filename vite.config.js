import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rm } from 'node:fs/promises';

function pruneDeploymentOnlyAssets() {
  return {
    name: 'prune-deployment-only-assets',
    apply: 'build',
    async closeBundle() {
      if (process.env.VITE_DEPLOY_FULL_JOB_PHOTOS === 'true') return;

      await Promise.all([
        rm('dist/jobsite-photos/images', { recursive: true, force: true }),
        rm('dist/jobsite-photos/amap-geocode-cache.json', { force: true }),
        rm('dist/jobsite-photos/groups.html', { force: true }),
        rm('dist/jobsite-photos/index-standalone.html', { force: true }),
        rm('dist/jobsite-photos/index.html', { force: true }),
        rm('dist/jobsite-photos/jobsite-case-clusters.json', { force: true }),
        rm('dist/jobsite-photos/jobsite-photo-groups.json', { force: true }),
        rm('dist/jobsite-photos/jobsite-photo-index.json', { force: true }),
        rm('dist/jobsite-photos/ocr-cache.json', { force: true }),
        rm('dist/jobsite-photos/processing-report.json', { force: true }),
        rm('dist/jobsite-photos/processing-report.md', { force: true }),
        rm('dist/jobsite-photos/reverse-geocode-cache.json', { force: true }),
        rm('dist/jobsite-photos/.DS_Store', { force: true }),
      ]);
    },
  };
}

export default defineConfig({
  plugins: [react(), pruneDeploymentOnlyAssets()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          three: ['three'],
          amap: ['@amap/amap-jsapi-loader'],
          ocr: ['tesseract.js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
