import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1',
    port: 3000,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production'
          ? 'https://git-viz-lytics.vercel.app'
          : 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
