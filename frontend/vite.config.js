import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // sockjs-client referencia `global` (de Node) en el código que se ejecuta
  // en el navegador. Sin este alias, en producción lanza
  // "ReferenceError: global is not defined" y deja la app en blanco.
  define: {
    global: 'window',
  },
  optimizeDeps: {
    // sockjs-client es CommonJS; Vite necesita pre-bundlearlo para ESM
    include: ['sockjs-client', '@stomp/stompjs'],
  },
  define: {
  global: 'window',
},
})