import { describe, expect, it } from 'vitest'
import { getCapabilityCatalog } from '../../../../../../src/core/learning-engine/composition/oui/capability-catalog'

describe('capability catalog', () => {
  it('includes a versioned, serializable section index', () => {
    const catalog = getCapabilityCatalog()
    expect(catalog.schemaVersion).toBe(1)
    expect(catalog.sections.find((s) => s.type === 'flowchart')?.mentalModel).toBeTruthy()
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog)
  })
})
