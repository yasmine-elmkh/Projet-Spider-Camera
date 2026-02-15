/**
 * Configuration de Vite pour le projet React
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Configuration du serveur de développement
  server: {
    port: 5173,
    host: true,
    open: true, // Ouvre automatiquement le navigateur
  },
  
  // Configuration du build
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})