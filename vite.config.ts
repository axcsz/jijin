import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Ensures relative paths in built index.html
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'APP_ADMIN'],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/nav': {
          target: 'http://api.fund.eastmoney.com',
          changeOrigin: true,
          rewrite: (path) => {
             const url = new URL(path, 'http://localhost');
             const code = url.searchParams.get('code') || '';
             return `/f10/lsjz?fundCode=${code}&pageIndex=1&pageSize=1`;
          },
          headers: {
            'Referer': 'http://fund.eastmoney.com/'
          }
        }
      }
    },
  };
});
