import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El "base" debe coincidir con el nombre de tu repo: https://<usuario>.github.io/<repo>/
export default defineConfig({
  base: '/FinTrack/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['.app.github.dev'],
  },
})
