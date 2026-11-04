import { describe, expect, it } from 'vitest'
import { validateEvidenceReferences } from '../../../../../../src/core/learning-engine/composition/oui/source-provenance'

describe('source provenance', () => {
  it('checks references without retrieving external sources', () => {
    expect(validateEvidenceReferences([{ id: 'doc', kind: 'web', uri: 'https://example.com', supports: ['objective-1'] }], ['doc'])).toEqual([])
    expect(validateEvidenceReferences([], ['missing'])[0].code).toBe('MISSING_SOURCE')
  })
})

it('rejects malformed references, credential-bearing URLs and unknown objectives', () => {
  expect(validateEvidenceReferences(null, [])[0].code).toBe('INVALID_SOURCE')
  for (const uri of ['https://user:password@example.com/a', 'https://example.com/?api_key=private']) {
    expect(validateEvidenceReferences([{ id: 'doc', kind: 'web', uri, supports: [] }], [])[0].code).toBe('UNSAFE_LOCATOR')
  }
  expect(validateEvidenceReferences([{ id: 'doc', kind: 'document', uri: 'https://example.com', supports: ['missing'] }], [], new Set()).map((d) => d.code)).toContain('UNKNOWN_OBJECTIVE')
})
