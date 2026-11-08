/** Upstream component snapshots used by the unified page catalog.
 * The compiler and editor consume serializable contracts without importing the
 * React component library; browser renderers load it lazily.
 */
import type { ComponentGroup, LibraryJSONSchema } from '@openuidev/lang-core'
import schema from './schema.json'
import spec from './spec.json'
import { rootCall, pageBodySource } from '../../../composition/oui/page-source'

export const OPENUI_SECTION_TYPE = 'openui'

/** JSON Schema of the standard OpenUI library (`openuiLibrary.toJSONSchema()`). */
export const standardOpenUISchema = schema as unknown as LibraryJSONSchema

export interface StandardOpenUISpec {
  root: string
  /** Positional signature and description of every component. */
  components: Record<string, { signature: string; description: string }>
  componentGroups: ComponentGroup[]
}

/** Signatures and groups of the standard OpenUI library. */
export const standardOpenUISpec = spec as StandardOpenUISpec

/** The page body as a program; declarations and component names are preserved. */
export const openUIProgramOf = pageBodySource

/** Print an `openui` section file: directive line followed by the program. */
export function printOpenUISection(program: string, title: string, heading?: string): string {
  const call = rootCall(program)
  if (!call) throw new Error('A page body must have a complete root component call')
  const args = [JSON.stringify(title), program.slice(call.start, call.end), ...(heading ? [JSON.stringify(heading)] : [])].join(', ')
  return `${program.slice(0, call.start)}Page(${args})${program.slice(call.end)}`.trimEnd() + '\n'
}
