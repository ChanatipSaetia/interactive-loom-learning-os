import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { generateCatalogSource } from './src/core/learning-engine/composition/oui/catalog-gen'

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

const CONTENT_ID = /^[a-z0-9][a-z0-9_-]*$/

/**
 * Dev-server endpoint for saving OpenUI Lang section sources:
 * POST /api/content/save-section { topicId, sectionName, source }
 * → validates via the OpenUI Validation Gateway, then writes
 *   public/content/<topicId>/sections/<sectionName>.oui
 */
function ouiSavePlugin(): Plugin {
  return {
    name: 'oui-save-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/content/save-section') {
          next()
          return
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          const send = (status: number, payload: unknown) => {
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(payload))
          }
          try {
            const { topicId, sectionName, source } = JSON.parse(body)
            if (typeof source !== 'string' || !CONTENT_ID.test(topicId ?? '') || !CONTENT_ID.test(sectionName ?? '')) {
              send(400, { error: 'Expected { topicId, sectionName, source } with lowercase IDs ([a-z0-9_-]).' })
              return
            }

            const { validateOUISection } = await server.ssrLoadModule('/src/core/learning-engine/validation/oui-gateway.ts')
            const file = `${topicId}/sections/${sectionName}.oui`
            const result = validateOUISection(source, { topicId, sectionName, file })
            if (result.status === 'error') {
              send(422, {
                ok: false,
                validationStatus: result.status,
                diagnostics: result.diagnostics,
                error: `Validation failed with ${result.diagnostics.length} diagnostic(s). Fix issues before saving.`,
              })
              return
            }

            const target = path.resolve(process.cwd(), 'public', 'content', file)
            fs.mkdirSync(path.dirname(target), { recursive: true })
            fs.writeFileSync(target, source, 'utf-8')
            send(200, result.status === 'warning' ? { ok: true, warnings: result.diagnostics } : { ok: true })
          } catch (e: unknown) {
            send(500, { error: e instanceof Error ? e.message : String(e) })
          }
        })
      })
    },
  }
}

const CONTENT_ROOT = path.resolve(process.cwd(), 'public', 'content')

function contentTopicIds(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) return []
  return fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(CONTENT_ROOT, entry.name, 'topic.oui')))
    .map((entry) => entry.name)
}

/**
 * Generates the content catalog `content/index.oui` from the topic folders in
 * public/content: served on the fly in dev, emitted as an asset at build time.
 */
function contentCatalogPlugin(): Plugin {
  return {
    name: 'loom-content-catalog',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (!url.endsWith('/content/index.oui')) {
          next()
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' })
        res.end(generateCatalogSource(contentTopicIds()))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'content/index.oui', source: generateCatalogSource(contentTopicIds()) })
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
      ouiSavePlugin(),
      contentCatalogPlugin(),
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
              // CodeMirror is only needed by the lazily loaded OpenUI code editor.
              if (/node_modules\/(@codemirror|@lezer|@marijn|crelt|style-mod|w3c-keyname)\//.test(id)) return 'vendor-codemirror'
              return 'vendor'
            }

          }
        }
      }
    }
  }
})
