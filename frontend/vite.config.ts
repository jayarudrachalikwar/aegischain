import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Real (non-demo) mode: forward /api to the NestJS backend so the session cookie stays same-origin.
    // Override the target with VITE_PROXY_TARGET (e.g. http://localhost:3100 if port 3000 is taken).
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000', changeOrigin: false },
    },
  },
})
