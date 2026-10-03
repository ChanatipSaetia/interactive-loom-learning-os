// CLI: generate the JSON Schema for hex campaign maps (`npm run hexmap:schema`).
// Lets the Red Hat YAML extension autocomplete and validate
// public/hexmaps/<topic-id>.yaml in VS Code (see .vscode/settings.json).

// @ts-expect-error - Node builtins (no @types/node in the browser tsconfig)
import * as fs from 'fs'
// @ts-expect-error - Node builtins (no @types/node in the browser tsconfig)
import * as path from 'path'
import { z } from 'zod'

import { HexCampaignSchema } from '../src/core/generic/hex-map/schema'

const OUT_PATH = 'schemas/hexmaps/hex-campaign.schema.json'

export function buildHexMapSchema(): Record<string, unknown> {
  const json = z.toJSONSchema(HexCampaignSchema, {
    io: 'input',
    target: 'draft-2020-12',
    unrepresentable: 'any',
  }) as Record<string, unknown>
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $comment: 'Generated from Zod by `npm run hexmap:schema` — do not edit by hand. Hex campaign map document — public/hexmaps/<topic-id>.yaml.',
    title: 'Hex campaign map',
    ...json,
  }
}

const abs = path.join(path.resolve(process.cwd()), OUT_PATH)
fs.mkdirSync(path.dirname(abs), { recursive: true })
fs.writeFileSync(abs, `${JSON.stringify(buildHexMapSchema(), null, 2)}\n`, 'utf-8')
console.log(`✓ ${OUT_PATH}`)
