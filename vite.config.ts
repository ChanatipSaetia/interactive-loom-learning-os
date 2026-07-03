import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/interactive-loom-learning-os/' : '/')

  return {
    base: basePath,
    plugins: [
      react(),
    ],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      open: false
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('anime')) return 'vendor-anime'
              return 'vendor'
            }
            if (id.includes('/src/sections/')) {
              const match = id.match(/\/src\/sections\/([a-z0-9-]+)/)
              return match ? `section-${match[1]}` : 'sections'
            }
          }
        }
      }
    }
  }
})
