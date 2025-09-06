// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  // Habilitar SSR para rutas dinámicas
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(),
    tailwind({
      // Configura explícitamente tailwind para evitar problemas
      configFile: './tailwind.config.js'
    })
  ],
  vite: {
    resolve: {
      alias: {
        '@components': path.resolve('./src/components'),
        '@layouts': path.resolve('./src/layouts'),
        '@data': path.resolve('./src/data')
      }
    }
  }
});