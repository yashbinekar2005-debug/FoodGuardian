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

      // Keep the OCR engine, its WASM core, and English trained data local to
      // the extension. MV3 disallows loading executable code from a CDN.
      const ocrDist = resolve(distDir, 'ocr');
      const ocrCoreDist = resolve(ocrDist, 'core');
      const ocrLangDist = resolve(ocrDist, 'lang');
      mkdirSync(ocrCoreDist, { recursive: true });
      mkdirSync(ocrLangDist, { recursive: true });
      copyFileSync(resolve(__dirname, 'offscreen.html'), resolve(distDir, 'offscreen.html'));
      copyFileSync(
        resolve(__dirname, 'node_modules/tesseract.js/dist/worker.min.js'),
        resolve(ocrDist, 'worker.min.js')
      );

      const coreFiles = [
        'tesseract-core.wasm.js', 'tesseract-core.wasm',
        'tesseract-core-simd.wasm.js', 'tesseract-core-simd.wasm',
        'tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm',
        'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm',
        'tesseract-core-relaxedsimd.wasm.js', 'tesseract-core-relaxedsimd.wasm',
        'tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm'
      ];
      for (const file of coreFiles) {
        copyFileSync(
          resolve(__dirname, `node_modules/tesseract.js-core/${file}`),
          resolve(ocrCoreDist, file)
        );
      }
      copyFileSync(
        resolve(__dirname, 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),
        resolve(ocrLangDist, 'eng.traineddata.gz')
      );
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
        ocr: resolve(__dirname, 'src/ocr.ts'),
        background: resolve(__dirname, 'src/background/service_worker.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'ocr') return 'ocr.js';
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
