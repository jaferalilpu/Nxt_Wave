import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the React app runs on 5173 and forwards /api calls to the
// backend, so the browser never has to deal with CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: ['..'] }, // the sample material lives one folder up
    proxy: { '/api': 'http://localhost:4000' },
  },
});
