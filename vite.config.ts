import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isLib = env.BUILD_MODE === 'lib'
  const basePath = env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/interactive-loom-learning-os/' : '/')

  if (isLib) {
    return {
      base: '/',
      plugins: [
        react(),
      ],
      define: {
        'process.env': JSON.stringify({}),
        'process.browser': 'true',
      },
      build: {
        outDir: 'dist-lib',
        lib: {
          entry: './libs/loom-sections.tsx',
          name: 'LoomSections',
          fileName: (format) => `loom-sections.${format === 'umd' ? 'umd.js' : 'js'}`,
          formats: ['umd', 'es'],
        },
        cssCodeSplit: false,
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          external: [],
          output: {
            inlineDynamicImports: true,
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') return 'loom-sections.css'
              return assetInfo.name
            },
          },
        },
      },
    }
  }

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
