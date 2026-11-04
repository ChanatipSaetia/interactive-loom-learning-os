/** Portable source references: locators only, never access tokens or private source contents. */
export type EvidenceKind = 'web' | 'document' | 'repository' | 'loom'
export interface EvidenceReference {
  id: string
  kind: EvidenceKind
  uri: string
  title?: string
  revision?: string
  locator?: string
  retrievedAt?: string
  supports: string[]
}
export interface EvidenceDiagnostic {
  code: 'DUPLICATE_SOURCE' | 'MISSING_SOURCE' | 'UNSUPPORTED_SCHEME'
  reference: string
}
export function validateEvidenceReferences(sources: EvidenceReference[], referencedIds: readonly string[]): EvidenceDiagnostic[] {
  const diagnostics: EvidenceDiagnostic[] = []
  const ids = new Set<string>()
  for (const source of sources) {
    if (ids.has(source.id)) diagnostics.push({ code: 'DUPLICATE_SOURCE', reference: source.id })
    ids.add(source.id)
    if (!/^(https:\/\/|loom:)/.test(source.uri)) diagnostics.push({ code: 'UNSUPPORTED_SCHEME', reference: source.id })
  }
  for (const id of referencedIds) if (!ids.has(id)) diagnostics.push({ code: 'MISSING_SOURCE', reference: id })
  return diagnostics
}
