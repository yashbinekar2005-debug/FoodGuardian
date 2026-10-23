import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/content_script.ts'),
      name: 'FoodGuardianContent',
      formats: ['iife'],
      fileName: () => 'content.js'
    }
  }
});
