import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // required so file:// loading works in the packaged Electron app
  server: { port: parseInt(process.env.PORT || '5173') },
  build: { outDir: 'dist', emptyOutDir: true },
});
