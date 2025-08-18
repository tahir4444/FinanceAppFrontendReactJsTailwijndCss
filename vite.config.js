import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const backendBaseUrl = env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    
    // === BUILD OPTIMIZATIONS FOR DEPLOYMENT ===
    build: {
      // Faster minification
      minify: 'esbuild',
      
      // Modern target for better performance
      target: 'esnext',
      
      // Skip compressed size reporting for faster builds
      reportCompressedSize: false,
      
      // Optimize chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better browser caching
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            utils: ['axios'],
            // Add more chunks based on your dependencies
          },
        },
      },
      
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },

    // === DEVELOPMENT SERVER CONFIG ===
    server: {
      port: 5173,
      host: true, // This enables listening on all local IPs
      hmr: {
        port: 5173, // HMR port (should match server port)
        host: 'localhost', // HMR host
        clientPort: 5173, // Ensure client connects to correct port
        overlay: {
          warnings: false,
          errors: true,
        },
        // Add WebSocket connection retry logic
        timeout: 30000, // Connection timeout
      },
      watch: {
        usePolling: true, // Use polling for file watching (helps on some systems)
        interval: 1000, // Polling interval
      },
      proxy: {
        '/api': {
          target: backendBaseUrl,
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

    // === DEPENDENCY OPTIMIZATION ===
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
      // Force re-optimization on lockfile update
      force: false,
    },

    // === WEBSOCKET & HMR OPTIMIZATIONS ===
    clearScreen: false, // Keep console history for better debugging

    // === ENVIRONMENT VARIABLES ===
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.VITE_BACKEND_BASE_URL': JSON.stringify(backendBaseUrl),
    },

    // === ADDITIONAL OPTIMIZATIONS ===
    esbuild: {
      // Drop console and debugger in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },

    // === CSS OPTIMIZATION ===
    css: {
      // Optimize CSS for production
      devSourcemap: mode === 'development',
    },
  };
});

// This Vite configuration file sets up a React application with:
// - Optimized build settings for faster deployment
// - Better chunk splitting for browser caching
// - Development server with proxy configuration
// - Environment variable handling for multiple deployment targets