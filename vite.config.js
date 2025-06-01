import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        manifest: resolve(__dirname, 'manifest.json'),
        background: resolve(__dirname, 'background.js'),
        content: resolve(__dirname, 'content.js'),
        popup: resolve(__dirname, 'popup.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});