import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    include: ['framer-motion', 'react', 'react-dom', 'gsap'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'socket-vendor': ['socket.io-client'],
          'zustand':       ['zustand'],
          'gsap':          ['gsap'],
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
