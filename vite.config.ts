import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { generateCatalogSource } from './src/core/learning-engine/composition/oui/catalog-gen'

const CONTENT_ROOT = path.resolve(process.cwd(), 'public', 'content')

/** `@openuidev/react-ui` (and its headless layer), rendered only by the lazily loaded `openui` section. */
const OPENUI_PACKAGES = /node_modules\/@openuidev\/react-(ui|headless)\//

type ModuleInfoLookup = (id: string) => { importers: readonly string[]; dynamicImporters: readonly string[]; isEntry: boolean } | null

const reachedThrough = new Map<string, boolean>()

/**
 * True when every import chain to a node_modules module passes through a
 * package matching `via`, i.e. the module only exists to serve that package
 * and can be split out with it. Shared dependencies (React, zod, …) are false.
 */
function onlyReachedThrough(id: string, via: RegExp, getModuleInfo: ModuleInfoLookup): boolean {
  const cached = reachedThrough.get(id)
  if (cached !== undefined) return cached
  if (via.test(id)) return true
  const info = getModuleInfo(id)
  if (!info || info.isEntry || !id.includes('node_modules')) return false
  const importers = [...info.importers, ...info.dynamicImporters]
  if (importers.length === 0) return false
  reachedThrough.set(id, true) // optimistic while walking import cycles
  const result = importers.every((importer) => onlyReachedThrough(importer, via, getModuleInfo))
  reachedThrough.set(id, result)
  return result
}

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
      contentCatalogPlugin(),
    ],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      open: false
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        // Four pages: the learning app, Loom Studio (authoring), Loom Viewer and the "Create with Claude" guide.
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          studio: path.resolve(process.cwd(), 'studio.html'),
          viewer: path.resolve(process.cwd(), 'viewer.html'),
          create: path.resolve(process.cwd(), 'create.html'),
        },
        output: {
          manualChunks(id, { getModuleInfo }) {
            if (id.includes('node_modules')) {
              if (id.includes('anime')) return 'vendor-anime'
              // CodeMirror is only needed by the lazily loaded OpenUI code editor.
              if (/node_modules\/(@codemirror|@lezer|@marijn|crelt|style-mod|w3c-keyname)\//.test(id)) return 'vendor-codemirror'
              // The standard OpenUI component library is only needed by the lazily loaded `openui` section.
              if (onlyReachedThrough(id, OPENUI_PACKAGES, getModuleInfo)) return 'vendor-openui'
              return 'vendor'
            }

          }
        }
      }
    }
  }
})
