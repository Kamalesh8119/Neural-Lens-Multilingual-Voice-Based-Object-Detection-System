import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-webcam')) return 'capture'
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (id.includes('react-hot-toast')) return 'feedback'
          if (id.includes('react')) return 'react-vendor'
        },
      },
    },
  },
})
