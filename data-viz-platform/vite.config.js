// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // Configure development server
    port: 3000,
    strictPort: true,
    headers: {
      // Ensure proper MIME types are sent
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    modulePreload: true,
    manifest: true,
    rollupOptions: {
      output: {
        // Ensure proper chunks and file naming
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  optimizeDeps: {
    // Pre-bundle dependencies to avoid MIME type issues
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'recharts',
      'papaparse',
      'xlsx'
    ]
  }
});