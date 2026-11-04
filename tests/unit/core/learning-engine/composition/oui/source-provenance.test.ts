import { describe, expect, it } from 'vitest'
import { validateEvidenceReferences } from '../../../../../../src/core/learning-engine/composition/oui/source-provenance'

describe('source provenance', () => {
  it('checks references without retrieving external sources', () => {
    expect(validateEvidenceReferences([{ id: 'doc', kind: 'web', uri: 'https://example.com', supports: ['objective-1'] }], ['doc'])).toEqual([])
    expect(validateEvidenceReferences([], ['missing'])[0].code).toBe('MISSING_SOURCE')
  })
})
