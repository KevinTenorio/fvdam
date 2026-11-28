import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  // o worker do núcleo Python é um módulo ES (o Pyodide exige worker do tipo module)
  worker: {
    format: 'es'
  },
  server: {
    port: 3000
  }
});
