import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Subruta real donde GitHub Pages sirve este proyecto:
  // https://jonatanpowerj-crypto.github.io/CONTROLESCOLAR50/
  base: '/CONTROLESCOLAR50/',
  build: {
    // GitHub Pages puede servir directo desde una carpeta "docs/"
    // dentro de la rama, sin necesidad de una rama aparte.
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index-react.html',
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
})