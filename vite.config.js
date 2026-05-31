import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'ctv-active': ['./src/ctvActive.js'],
          'ctv-pool':   ['./src/ctvPool.js'],
        }
      }
    }
  }
})
