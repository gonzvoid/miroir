import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'url';
import path from 'path';
import baseTw from './tailwind.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          ...baseTw,
          content: [
            './src/islands/**/*.{js,jsx}',
            './src/components/Focal.jsx',
            './src/components/Tiles.jsx',
            './src/components/icons.js',
          ],
          corePlugins: { ...(baseTw.corePlugins || {}), preflight: false },
        }),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../landing'),
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/islands/entry.jsx'),
      formats: ['iife'],
      name: 'MiroirIslands',
      fileName: () => 'islands.js',
    },
    rollupOptions: { output: { assetFileNames: 'islands.[ext]' } },
  },
});
