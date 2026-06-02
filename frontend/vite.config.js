import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // sockjs-client es CommonJS; Vite necesita pre-bundlearlo para ESM
    include: ['sockjs-client', '@stomp/stompjs'],
  },
})