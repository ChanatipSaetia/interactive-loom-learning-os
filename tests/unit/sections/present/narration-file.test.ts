import { describe, it, expect } from 'vitest'
import { validateOUINarration } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { content } from './helpers'

const section = content('http-caching/sections/directives.oui')
const ctx = { file: 'sections/directives.narrate.oui', sectionName: 'directives' }

describe('narration files', () => {
  it('compiles the steps and their effects', () => {
    const result = validateOUINarration(content('http-caching/sections/directives.narrate.oui'), section, ctx)
    expect(result.diagnostics).toEqual([])
    expect(result.status).toBe('valid')
    const steps = result.payload?.steps ?? []
    expect(steps).toHaveLength(4)
    expect(steps[1]).toEqual({
      caption: 'The name no-cache is the one people misread.',
      effects: [
        { kind: 'highlight', target: 'noCache' },
        { kind: 'callout', target: 'noCache', text: expect.stringMatching(/^no-cache does not mean/) },
      ],
    })
    expect(steps[0].effects).toEqual([{ kind: 'spotlight', targets: ['maxAge', 'noCache', 'noStore', 'private'] }])
  })

  it('warns about targets that name no statement or no prop of the section', () => {
    const result = validateOUINarration(`root = Narration([a])
a = NarrationStep("Look", [Highlight("nocache"), Callout("noCache.colour", "Hi")])
`, section, ctx)
    expect(result.status).toBe('warning')
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      '"nocache" does not name a statement of sections/directives.oui.',
      '"noCache.colour": TaxonomyCategory has no prop "colour".',
    ])
    expect(result.diagnostics[0].fixHint).toContain('noCache')
    expect(result.diagnostics[0].line).toBe(2)
  })

  it('accepts prop paths, list indexes and steps with only a caption', () => {
    const result = validateOUINarration(`root = Narration([a, b])
a = NarrationStep("Only words.")
b = NarrationStep(null, [Highlight("noCache.description"), Highlight("root.categories[0]")])
`, section, ctx)
    expect(result.diagnostics).toEqual([])
  })

  it('needs its section and the Narration root', () => {
    expect(validateOUINarration('root = Narration([])\n', undefined, ctx).diagnostics[0].message).toBe('There is no sections/directives.oui for this narration to play with.')
    const wrong = validateOUINarration('root = Text("T", ["p"])\n', section, ctx)
    expect(wrong.status).toBe('error')
    expect(wrong.payload).toBeNull()
  })
})
