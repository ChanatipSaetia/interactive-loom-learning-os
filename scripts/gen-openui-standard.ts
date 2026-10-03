#!/usr/bin/env tsx
/**
 * Snapshot the standard OpenUI component library (`@openuidev/react-ui`) for
 * the `openui` section type.
 *
 *   npx tsx scripts/gen-openui-standard.ts           # write the snapshot
 *   npx tsx scripts/gen-openui-standard.ts --check   # fail if it is stale
 *
 * The compiler and the Studio editor only need the library's JSON Schema and
 * its signatures, so they read this snapshot instead of importing react-ui,
 * which keeps react-ui (charts, markdown, …) out of the eagerly loaded bundle.
 * Only the lazily loaded `openui` section renderer imports react-ui itself
 * (its genui-lib bundle). `dark-theme.json` holds react-ui's dark theme tokens,
 * which the renderer overlays with the Loom palette.
 * Re-run after upgrading @openuidev/react-ui.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defaultDarkTheme } from '@openuidev/react-ui'
import { openuiLibrary } from '@openuidev/react-ui/genui-lib'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'src/core/learning-engine/sub-contexts/progressive-content/openui-standard')

const spec = openuiLibrary.toSpec()
const files: Record<string, unknown> = {
  'schema.json': openuiLibrary.toJSONSchema(),
  'spec.json': {
    root: openuiLibrary.root,
    components: spec.components,
    componentGroups: openuiLibrary.componentGroups ?? [],
  },
  'dark-theme.json': Object.fromEntries(Object.entries(defaultDarkTheme).filter(([, v]) => typeof v === 'string')),
}

const check = process.argv.includes('--check')
let stale = false
for (const [name, value] of Object.entries(files)) {
  const file = path.join(OUT_DIR, name)
  const text = `${JSON.stringify(value, null, 2)}\n`
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
      console.error(`stale: ${path.relative(ROOT, file)}`)
      stale = true
    }
  } else {
    fs.writeFileSync(file, text)
    console.log(`wrote ${path.relative(ROOT, file)}`)
  }
}
if (stale) {
  console.error('Run `npm run openui:gen` to refresh the standard OpenUI snapshot.')
  process.exit(1)
}
