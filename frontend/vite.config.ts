import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "hachete-design",
    project: "hrms"
  })],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 4000,
    host: '0.0.0.0', // Changed from 'true' for better tunnel compatibility
    strictPort: true, // Force port 4000, don't fallback
    allowedHosts: [
      'localhost',
      '127.0.0.1'
      // (Removed: sure989.org and api.sure989.org references)
    ],
    // Add connection stability settings
    hmr: {
      port: 4000,
      host: 'localhost'
    },
    watch: {
      usePolling: true, // Use polling instead of native file watchers
      interval: 100,    // Poll every 100ms
      ignored: ['**/node_modules/**', '**/.git/**'] // Ignore heavy directories
    }
  },

  build: {
    sourcemap: true
  }
})