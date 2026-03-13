import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: '../../assets',
  // MapTiler SDK (MapLibre GL JS) loads web workers internally — exclude both
  // the SDK and maplibre-gl from Vite's dep pre-bundler so the worker blob
  // URLs stay intact at runtime (pre-bundling breaks them).
  optimizeDeps: {
    exclude: ['@maptiler/sdk', 'maplibre-gl'],
  },
})
