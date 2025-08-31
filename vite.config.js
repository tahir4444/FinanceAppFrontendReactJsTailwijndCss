import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const backendBaseUrl = env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';

  return {
    plugins: [
      react(),
      {
        name: 'server-info',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Log all requests for debugging
            console.log(`📥 ${req.method} ${req.url}`);
            next();
          });
          
          // Add custom server startup message
          server.httpServer?.once('listening', () => {
            const address = server.httpServer?.address();
            if (address && typeof address === 'object') {
              console.log('\n🚀 Finance Admin Panel Development Server Started!');
              console.log('='.repeat(60));
              console.log(`📱 Local: http://localhost:${address.port}`);
              console.log(`🌐 Network: http://0.0.0.0:${address.port}`);
              console.log(`🔧 API Proxy: ${backendBaseUrl}`);
              console.log(`📁 Project Root: ${process.cwd()}`);
              console.log(`⚡ HMR: Enabled on port ${address.port}`);
              console.log(`🔍 Debug Mode: Enabled`);
              console.log('='.repeat(60));
              console.log('💡 Press Ctrl+C to stop the server\n');
            }
          });
        }
      }
    ],
    
    // === BUILD OPTIMIZATIONS FOR DEPLOYMENT ===
    build: {
      // Faster minification
      minify: 'esbuild',
      
      // Modern target for better performance
      target: 'esnext',
      
      // Skip compressed size reporting for faster builds
      reportCompressedSize: false,
      
      // Disable source maps in build to avoid conflicts
      sourcemap: false,
      
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
      strictPort: false, // Allow fallback to next available port
      open: false, // Don't auto-open browser
      cors: true, // Enable CORS
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
      // Disable source maps in esbuild
      sourcemap: false,
    },

    // === CSS OPTIMIZATION ===
    css: {
      // Disable CSS source maps completely
      devSourcemap: false,
    },

    // === SOURCE MAP CONFIGURATION ===
    // Completely disable source maps to avoid browser extension conflicts
    sourcemap: false,
    
    // === ADDITIONAL DEVELOPMENT SETTINGS ===
    // Show full server details and information
    logLevel: 'info',
  };
});

// This Vite configuration file sets up a React application with:
// - Optimized build settings for faster deployment
// - Better chunk splitting for browser caching
// - Development server with proxy configuration
// - Environment variable handling for multiple deployment targets