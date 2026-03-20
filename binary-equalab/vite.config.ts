import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Tauri expects a fixed port, fail if that port is not available
    clearScreen: false,
    server: {
      port: 3000,
      strictPort: true,
      host: '127.0.0.1', // Changed from 0.0.0.0 to avoid network interface issues
      // Fix for Termux/rootless containers
      // @ts-ignore
      fs: { strict: false },
    },
    // Env variables starting with TAURI_ are automatically available in import.meta.env
    envPrefix: ['VITE_', 'TAURI_'],
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
