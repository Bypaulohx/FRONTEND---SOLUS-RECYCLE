import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Permite apontar o proxy para outra porta em desenvolvimento (ex.: VITE_BACKEND_URL=http://localhost:8007).
const backendUrl = process.env.VITE_BACKEND_URL ?? 'http://localhost:8006';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Backend Python (FastAPI): as rotas já começam com /api.
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
});
