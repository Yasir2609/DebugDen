import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Proxy /api requests to the backend Express server
    proxy: {
      '/api': {
        target: process.env.BACKEND_PROXY_TARGET || 'https://debugden-api.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
