import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure this is set correctly for your deployment
  build: {
    outDir: 'dist', // Output directory for the build
    assetsDir: 'assets', // Directory for assets within the output directory
    sourcemap: false, // Disable sourcemaps for production
    modulePreload: true, // Enable module preload
    manifest: true, // Generate a manifest file
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks
          vendor: ['react', 'react-dom', '@mui/material', '@mui/icons-material', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  },
});