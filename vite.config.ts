import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

function okfSavePlugin(): Plugin {
  return {
    name: 'okf-save-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/okf/save-section') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', async () => {
            try {
              const { topicId, sectionName, sectionMd, dataYaml } = JSON.parse(body)
              if (!topicId || !sectionName || sectionMd == null || dataYaml == null) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Missing required fields: topicId, sectionName, sectionMd, dataYaml' }))
                return
              }

              // Validate before disk write — use createRequire to bypass esbuild static analysis
              const require = createRequire(import.meta.url)
              const { validateOKFSectionFile } = require('./src/core/learning-engine/validation/gateway.ts')
              const payloadToValidate = (typeof dataYaml === 'string' && dataYaml.trim())
                ? dataYaml
                : sectionMd
              const validationResult = validateOKFSectionFile(
                payloadToValidate,
                { topicId, sectionName, file: `${topicId}/${sectionName}` }
              )

              if (validationResult.status === 'error') {
                res.writeHead(422, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  ok: false,
                  validationStatus: validationResult.status,
                  diagnostics: validationResult.diagnostics,
                  error: `Validation failed with ${validationResult.diagnostics.length} error(s). Fix issues before saving.`,
                }))
                return
              }

              const dir = path.resolve(process.cwd(), 'public', 'okf', topicId, 'sections', sectionName)
              fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(path.join(dir, 'section.md'), sectionMd, 'utf-8')
              fs.writeFileSync(path.join(dir, 'data.yaml'), dataYaml, 'utf-8')

              const response: Record<string, unknown> = { ok: true }
              if (validationResult.status === 'warning') {
                response.warnings = validationResult.diagnostics
              }
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(response))
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: msg }))
            }
          })
        } else {
          next()
        }
      })
    },
  }
}

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
      okfSavePlugin(),
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

          }
        }
      }
    }
  }
})
