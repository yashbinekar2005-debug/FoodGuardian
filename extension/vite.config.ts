import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Helper plugin to copy manifest and icons into dist
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-postbuild',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const iconsDist = resolve(distDir, 'icons');
      if (!existsSync(iconsDist)) {
        mkdirSync(iconsDist, { recursive: true });
      }

      // Copy manifest
      if (existsSync(resolve(__dirname, 'manifest.json'))) {
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );
      }

      // Copy icons if present
      const iconsDir = resolve(__dirname, 'public/icons');
      if (existsSync(iconsDir)) {
        for (const icon of ['icon16.png', 'icon48.png', 'icon128.png']) {
          const srcPath = resolve(iconsDir, icon);
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, resolve(iconsDist, icon));
          }
        }
      }
    }
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        content: resolve(__dirname, 'src/content/content_script.ts'),
        background: resolve(__dirname, 'src/background/service_worker.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'background') return 'background.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  plugins: [chromeExtensionPlugin()]
});
