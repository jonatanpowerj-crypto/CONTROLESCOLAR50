import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-react',
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: true,
    allowedHosts: ['.prod-runtime.all-hands.dev'],
    hmr: {
      clientPort: 443,
    },
  },
})
