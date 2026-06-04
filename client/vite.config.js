import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    // Force esbuild to pre-bundle these — prevents Rollup TDZ circular-dep crashes
    include: ['framer-motion', 'react', 'react-dom'],
  },

  build: {
    rollupOptions: {
      output: {
        // Isolate large libs into their own chunks so Rollup resolves
        // initialization order correctly and avoids TDZ errors
        manualChunks: {
          'react-vendor':   ['react', 'react-dom'],
          'framer-motion':  ['framer-motion'],
          'socket-vendor':  ['socket.io-client'],
          'zustand':        ['zustand'],
        },
      },
    },
  },

  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
