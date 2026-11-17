import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/_matrix': {
        target: 'http://localhost:8008',
        changeOrigin: true,
      },
      '/_synapse': {
        target: 'http://localhost:8008',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['@matrix-org/olm'],
  },
});
