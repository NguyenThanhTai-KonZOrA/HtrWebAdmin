import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject build timestamp as APP_VERSION
    __APP_VERSION__: JSON.stringify(new Date().getTime().toString()),
  },
  build: {
    // Generate unique filenames for each build to prevent caching
    rollupOptions: {
      output: {
        // Add timestamp to chunk names
        chunkFileNames: 'assets/[name]-[hash]-[timestamp].js',
        entryFileNames: 'assets/[name]-[hash]-[timestamp].js',
        assetFileNames: 'assets/[name]-[hash]-[timestamp].[ext]'
      }
    }
  }
})
