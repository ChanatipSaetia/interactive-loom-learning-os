/** Portable locators only: assistants research with their own authorized host tools. */
import { z } from 'zod'

export const EvidenceReferenceSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(['web', 'document', 'repository', 'loom']),
  uri: z.string().min(1).max(2048),
  title: z.string().max(500).optional(),
  revision: z.string().max(200).optional(),
  locator: z.string().max(500).optional(),
  retrievedAt: z.iso.datetime().optional(),
  supports: z.array(z.string().min(1).max(120)).max(100),
}).strict()
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>
export type EvidenceKind = EvidenceReference['kind']
export interface EvidenceDiagnostic {
  code: 'INVALID_SOURCE' | 'DUPLICATE_SOURCE' | 'MISSING_SOURCE' | 'UNSUPPORTED_SCHEME' | 'UNSAFE_LOCATOR' | 'UNKNOWN_OBJECTIVE'
  reference: string
}
export function validateEvidenceReferences(input: unknown, referencedIds: readonly string[], objectives?: ReadonlySet<string>): EvidenceDiagnostic[] {
  const parsed = z.array(EvidenceReferenceSchema).max(100).safeParse(input)
  if (!parsed.success) return parsed.error.issues.map((i) => ({ code: 'INVALID_SOURCE', reference: i.path.join('.') }))
  const diagnostics: EvidenceDiagnostic[] = []
  const ids = new Set<string>()
  for (const source of parsed.data) {
    if (ids.has(source.id)) diagnostics.push({ code: 'DUPLICATE_SOURCE', reference: source.id })
    ids.add(source.id)
    try {
      const url = new URL(source.uri)
      if (!['https:', 'loom:'].includes(url.protocol)) diagnostics.push({ code: 'UNSUPPORTED_SCHEME', reference: source.id })
      if (url.username || url.password || [...url.searchParams.keys()].some((key) => /token|secret|key|auth|credential|signature/i.test(key))) diagnostics.push({ code: 'UNSAFE_LOCATOR', reference: source.id })
    } catch { diagnostics.push({ code: 'UNSUPPORTED_SCHEME', reference: source.id }) }
    for (const objective of source.supports) if (objectives && !objectives.has(objective)) diagnostics.push({ code: 'UNKNOWN_OBJECTIVE', reference: source.id })
  }
  for (const id of referencedIds) if (!ids.has(id)) diagnostics.push({ code: 'MISSING_SOURCE', reference: id })
  return diagnostics
}
