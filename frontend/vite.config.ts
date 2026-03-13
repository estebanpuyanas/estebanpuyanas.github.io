import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: '../../assets',
  // @maptiler/sdk loads web workers internally — exclude it from Vite's
  // dep pre-bundler so its worker URLs stay intact at runtime.
  // maplibre-gl and events are CJS packages that @maptiler/sdk imports;
  // force-include them so Vite wraps their module.exports as ESM defaults.
  optimizeDeps: {
    exclude: ['@maptiler/sdk'],
    include: ['maplibre-gl', 'events'],
  },
})
