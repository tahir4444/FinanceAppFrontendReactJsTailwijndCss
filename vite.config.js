import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  const apiUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // This enables listening on all local IPs
      hmr: {
        overlay: true, // Show errors as overlay
        port: 5173, // HMR port (should match server port)
        host: 'localhost', // HMR host
      },
      watch: {
        usePolling: true, // Use polling for file watching (helps on some systems)
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(
                'Sending Request to the Target:',
                req.method,
                req.url
              );
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(
                'Received Response from the Target:',
                proxyRes.statusCode,
                req.url
              );
            });
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
  };
});
// This Vite configuration file sets up a React application with a development server
